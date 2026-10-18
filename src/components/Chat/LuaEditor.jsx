import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { EditorView, basicSetup } from 'codemirror';
import { StreamLanguage } from '@codemirror/language';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { oneDark } from '@codemirror/theme-one-dark';

// Editor de código Lua das macros (CodeMirror 6). Carregado com React.lazy
// pelo MacroEditorDialog — só o mestre baixa esse bundle. Não-controlado: o
// valor inicial entra na criação e as mudanças saem por `onChange`.
const tema = EditorView.theme({
  '&': { height: '100%', fontSize: '13px' },
  '.cm-scroller': { fontFamily: 'Consolas, "Fira Code", monospace' },
});

const LuaEditor = ({ valorInicial, onChange }) => {
  const containerRef = useRef(null);
  // O editor é criado uma vez por montagem (trocar de macro remonta o
  // componente via `key` no diálogo) — o valor inicial só é lido na criação.
  const valorInicialRef = useRef(valorInicial);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const view = new EditorView({
      doc: valorInicialRef.current,
      parent: containerRef.current,
      extensions: [
        basicSetup,
        StreamLanguage.define(lua),
        oneDark,
        tema,
        EditorView.updateListener.of(update => {
          if (update.docChanged)
            onChangeRef.current(update.state.doc.toString());
        }),
      ],
    });
    return () => view.destroy();
  }, []);

  return (
    <div
      ref={containerRef}
      data-testid="lua-editor"
      style={{
        height: '100%',
        minHeight: 320,
        border: '1px solid var(--border-primary)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    />
  );
};

LuaEditor.propTypes = {
  valorInicial: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default LuaEditor;
