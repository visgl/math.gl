#!/usr/bin/env python3
# math.gl
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
"""Export full-precision references from a pinned upstream study checkout.
Usage: python3 regenerate.py STUDY_CHECKOUT OUTPUT_DIRECTORY
Requires Rscript with cdtr, terra, jsonlite, and study npm dependencies.
Only the disposable study checkout is modified. No project runtime dependencies.
"""
import pathlib
import subprocess
import sys

REVISION = 'd0767a5ef5f8e6281d39d89a98593589e25ca248'
study = pathlib.Path(sys.argv[1]).resolve()
out = pathlib.Path(sys.argv[2]).resolve()
assert subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=study, text=True).strip() == REVISION
out.mkdir(parents=True, exist_ok=True)
here = study / 'survey/dev-drafts/mathgl-terrain'
helper = '''
emit_reference <- function(name, tol, m, segments, mask) {
  stopifnot(m$max_err <= tol)
  value <- list(name=name, tolerance=tol, width=ncol(z), height=nrow(z),
    positions=as.vector(t(m$P)), indices=as.vector(t(m$T))-1L,
    segments=segments, mask=as.vector(t(mask)),
    versions=list(R=R.version.string, cdtr=as.character(packageVersion("cdtr")),
      terra=as.character(packageVersion("terra")), jsonlite=as.character(packageVersion("jsonlite")), GDAL=terra::gdal()))
  jsonlite::write_json(value, file.path(Sys.getenv("TERRAIN_REFERENCE_OUTPUT"), paste0(name, "-", tol, ".json")),
    auto_unbox=TRUE, digits=NA)
}
make_segments <- function(x, y, z, a, b) lapply(seq_along(a), function(i)
  list(c(x[a[i]], y[a[i]], z[a[i]]), c(x[b[i]], y[b[i]], z[b[i]])))
'''
for name in ['step.R', 'fixtures.R']:
    text = subprocess.check_output(['git', 'show', f'{REVISION}:survey/dev-drafts/mathgl-terrain/{name}'], cwd=study, text=True)
    text = text.replace('source("survey/dev-drafts/mathgl-terrain/greedy-tin.R")', 'source("survey/dev-drafts/mathgl-terrain/greedy-tin.R")\n' + helper)
    if name == 'step.R':
        text = text.replace('  for (m in list(', '  emit_reference("step", tol, b, make_segments(cx, cy, cz, s0, s1), matrix(TRUE, H, W))\n  for (m in list(')
    else:
        text = text.replace('  for (m in list(', '  emit_reference("pacific", tol, b, make_segments(ps$x, ps$y, cz, ps$s0[cs], ps$s1[cs]), mask)\n  for (m in list(')
        text = text.replace('  e <- mesh_error(b$P', '  emit_reference("sierra", tol, b, make_segments(ps2$x, ps2$y, cz2, ps2$s0, ps2$s1), inq)\n  e <- mesh_error(b$P')
    (here / name).write_text(text)
import os
env = {**os.environ, 'TERRAIN_REFERENCE_OUTPUT': str(out)}
for name in ['step.R', 'fixtures.R']:
    subprocess.run(['Rscript', str(here / name)], cwd=study, env=env, check=True)
# Export the full independent domain outline, including non-coast tile edges.
subprocess.run(['Rscript', '-e', '''
library(jsonlite)
f <- readRDS("survey/dev-drafts/mathgl-terrain/cache/fixtures.rds")
p <- f$pacific; a <- p$segs[,1]; b <- p$segs[,2]
s <- lapply(seq_along(a), function(i) list(p$coast[a[i],1:3], p$coast[b[i],1:3]))
write_json(s, file.path(Sys.getenv("TERRAIN_REFERENCE_OUTPUT"), "pacific-domain.json"), digits=NA)
'''], cwd=study, env=env, check=True)
