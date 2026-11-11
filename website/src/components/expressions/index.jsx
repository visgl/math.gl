// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React from 'react';
import {useColorMode} from '@docusaurus/theme-common';
import ExpressionPlayground from 'website-examples/core/expressions/src/app';
import './styles.css';

export default function Expressions() {
  const {colorMode} = useColorMode();
  return <ExpressionPlayground showHeader={false} theme={colorMode} />;
}
