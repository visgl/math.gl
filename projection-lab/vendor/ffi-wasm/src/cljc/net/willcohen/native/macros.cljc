;; Copyright (c) 2026 Will Cohen
;;
;; Part of clj-native, under the Apache License v2.0 with LLVM Exceptions.
;; See LICENSE for license information.
;; SPDX-License-Identifier: Apache-2.0 WITH LLVM-exception

#?(:clj
   (ns net.willcohen.native.macros
     "Helpers for the wrapper macros of C-library bindings on clj-native
      dispatch. Each consumer keeps its own macro, which knows the shape of
      one wrapper fn. This namespace supplies the name mappings, the fndefs
      walk and the JVM load-time intern loop.

      CLJS consumers can `:require` this .cljc directly, because squint
      0.11.187 and later auto-load .cljc macros."
     (:require [clojure.string :as string]))
   :cljs
   (ns net.willcohen.native.macros
     "Helpers for the wrapper macros of C-library bindings. This branch has
      no intern-library-fns!, because a CLJS consumer macro emits its defns
      at compile time. It adds underscore->camelCase for JS aliases."
     (:require [clojure.string :as string])))

(defn c-name->clj-name
  "Map a snake_case C name keyword to a hyphenated symbol. For a mixed-case
   C API, use camel-name->clj-name."
  [c-fn-keyword]
  (symbol (string/replace (name c-fn-keyword) "_" "-")))

(defn- upper-char?
  [ch]
  (and (not= ch (string/lower-case ch)) (= ch (string/upper-case ch))))

(defn- lower-char?
  [ch]
  (and (not= ch (string/upper-case ch)) (= ch (string/lower-case ch))))

(defn- word-start?
  "True when the capital at `i` opens a word: the character before it is
   not a capital, or it ends a capital run before a lower-case letter. The
   second test splits GDALGet into gdal-get."
  [s i]
  (let [prev (subs s (dec i) i)
        nxt  (when (< (inc i) (count s)) (subs s (inc i) (+ i 2)))]
    (or (not (upper-char? prev))
        (and (some? nxt) (lower-char? nxt)))))

(defn camel-name->clj-name
  "Map a mixed-case C name keyword to a lower-case hyphenated symbol.
   GDALGetDriverCount gives gdal-get-driver-count, and OGR_L_GetName gives
   ogr-l-get-name. A capital run such as PROJJSON stays whole."
  [c-fn-keyword]
  (let [s (name c-fn-keyword)
        n (count s)]
    (loop [i 0, out "", pending-sep? false]
      (if (>= i n)
        (symbol out)
        (let [ch (subs s i (inc i))]
          (if (= ch "_")
            (recur (inc i) out (not= out ""))
            (let [sep? (or pending-sep?
                           (and (not= out "")
                                (upper-char? ch)
                                (word-start? s i)))]
              (recur (inc i)
                     (str out (if sep? "-" "") (string/lower-case ch))
                     false))))))))

(defn fn-def-arg-syms
  "The parameter symbols of a fndefs entry, from its :argtypes names in C
   order."
  [fn-def]
  (mapv (fn [[arg-name _]] (symbol (name arg-name))) (:argtypes fn-def)))

(defn library-fns-form
  "A `do` form of the public wrapper defns for `fndefs`.

   `name-fn` maps a fndefs key to the public symbol. `emit-fn` takes the
   symbol, the key and the fn-def, and returns one defn form. `alias-name-fn`
   and `alias-emit-fn` add an optional second walk for a second spelling, and
   `alias-name-fn` returns nil to skip a key. All of them run at
   macro-expansion time."
  [fndefs {:keys [name-fn emit-fn alias-name-fn alias-emit-fn]}]
  (let [walk (fn [nf ef]
               (when (and nf ef)
                 (keep (fn [[fn-key fn-def]]
                         (when-let [fn-name (nf fn-key)]
                           (ef fn-name fn-key fn-def)))
                       fndefs)))]
    (cons 'do (concat (walk name-fn emit-fn)
                      (walk alias-name-fn alias-emit-fn)))))

#?(:clj
   (defn intern-library-fns!
     "Intern one wrapper fn per fndefs entry into `ns-sym` at load time,
      because the JVM macro cannot see the fndefs shape at expansion.
      `name-fn` maps a key to the public symbol. `make-fn` takes the key and
      the fn-def, and returns the fn.

      Call it only from inside the consumer macro. A direct call gives
      clj-kondo no macro to expand, so every generated var reads as
      unresolved."
     [ns-sym fndefs name-fn make-fn]
     (doseq [[fn-key fn-def] fndefs]
       (intern ns-sym (name-fn fn-key) (make-fn fn-key fn-def)))))

#?(:cljs
   (defn underscore->camelCase
     "Convert a snake_case string to camelCase, for the JS aliases that a
      consumer macro emits."
     [s]
     (let [parts (.split s "_")]
       (apply str (first parts)
              (map #(str (.toUpperCase (.substring % 0 1)) (.substring % 1))
                   (rest parts))))))

