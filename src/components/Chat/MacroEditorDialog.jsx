import React, { Suspense, lazy, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { MACRO_NOME_MAX } from 'common/utils/chat';
import { resumoRolagem, detalheRolagem } from 'common/utils/dados';
import { MACRO_DESCRICAO_MAX, MACRO_VAZIA, validarMacro } from 'common/utils/macros';

import { PreviaMacro } from './styles';

// CodeMirror só é baixado quando o mestre abre o editor.
const LuaEditor = lazy(() => import('./LuaEditor'));

const AJUDA_API =
  'API: enviar(texto) · inputQuery(pergunta, padrao) · choose(titulo, opcoes, padrao) · ' +
  'rolar("2d6+3") publica e devolve o total · rolarLocal("1d6") só devolve · math.random(a, b)';

// Formulário de uma macro (nova ou existente). "Testar" roda de verdade —
// inclusive as perguntas — e mostra o que seria publicado só aqui, sem enviar.
const FormularioMacro = ({ macro, onClose, onSalvar, onTestar }) => {
  const [valores, setValores] = useState({ ...MACRO_VAZIA, ...macro });
  const [salvando, setSalvando] = useState(false);
  const [testando, setTestando] = useState(false);
  const [previa, setPrevia] = useState(null); // { saidas } | { erro }
  const [tentouSalvar, setTentouSalvar] = useState(false);

  const problema = validarMacro(valores);
  const atualizar = patch => setValores(atual => ({ ...atual, ...patch }));

  const testar = async () => {
    setTestando(true);
    setPrevia(null);
    try {
      const saidas = await onTestar({ nome: valores.nome.trim() || 'teste', codigo: valores.codigo });
      if (saidas) setPrevia({ saidas });
    } catch (error) {
      setPrevia({ erro: error.message });
    } finally {
      setTestando(false);
    }
  };

  const salvar = async event => {
    event.preventDefault();
    setTentouSalvar(true);
    if (problema || salvando) return;
    setSalvando(true);
    try {
      await onSalvar(valores);
      onClose();
    } catch {
      // O erro já aparece no aviso do chat; o formulário continua aberto.
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={salvar} noValidate>
      <DialogTitle>{macro?.id ? `Editar macro — ${macro.nome}` : 'Nova macro'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            label="Nome (usado em /m nome)"
            value={valores.nome}
            onChange={event => atualizar({ nome: event.target.value })}
            slotProps={{ htmlInput: { maxLength: MACRO_NOME_MAX } }}
            sx={{ flex: '1 1 220px' }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={valores.somenteMestre}
                onChange={event => atualizar({ somenteMestre: event.target.checked })}
              />
            }
            label="Só o mestre vê e usa"
          />
        </Box>
        <TextField
          size="small"
          label="Descrição (opcional)"
          value={valores.descricao}
          onChange={event => atualizar({ descricao: event.target.value })}
          slotProps={{ htmlInput: { maxLength: MACRO_DESCRICAO_MAX } }}
        />
        <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
          {AJUDA_API}
        </Typography>
        <Box sx={{ height: '45vh', minHeight: 320 }}>
          <Suspense fallback={<CircularProgress size={24} sx={{ color: 'var(--color-primary)' }} />}>
            <LuaEditor valorInicial={valores.codigo} onChange={codigo => atualizar({ codigo })} />
          </Suspense>
        </Box>

        {previa && (
          <PreviaMacro $erro={Boolean(previa.erro)} role="status" aria-label="Prévia da macro">
            {previa.erro && `Erro: ${previa.erro}`}
            {previa.saidas?.length === 0 && 'A macro terminou sem enviar nada.'}
            {previa.saidas?.map((saida, indice) => (
              // Índice como key: a prévia é refeita inteira a cada teste.
              <div key={indice}>
                {saida.tipo === 'rolagem'
                  ? `🎲 ${resumoRolagem(saida.rolagem)} = ${saida.rolagem.total} ${detalheRolagem(saida.rolagem)}`
                  : saida.texto}
              </div>
            ))}
          </PreviaMacro>
        )}

        {tentouSalvar && problema && (
          <Typography variant="body2" role="alert" sx={{ color: 'error.main' }}>
            {problema}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={testar} disabled={testando || !valores.codigo.trim()}>
          {testando ? 'Testando…' : 'Testar (só você vê)'}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} color="inherit">
          Cancelar
        </Button>
        <Button type="submit" variant="contained" disabled={salvando}>
          Salvar
        </Button>
      </DialogActions>
    </form>
  );
};

FormularioMacro.propTypes = {
  macro: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSalvar: PropTypes.func.isRequired,
  onTestar: PropTypes.func.isRequired,
};

// `macro`: undefined = fechado; null = nova; objeto = edição.
const MacroEditorDialog = ({ macro, onClose, onSalvar, onTestar }) => (
  <Dialog
    open={macro !== undefined}
    // Clique fora não fecha: perderia o código em edição.
    onClose={(_event, motivo) => motivo !== 'backdropClick' && onClose()}
    fullWidth
    maxWidth="md"
  >
    {macro !== undefined && (
      <FormularioMacro
        key={macro?.id ?? 'nova'}
        macro={macro}
        onClose={onClose}
        onSalvar={onSalvar}
        onTestar={onTestar}
      />
    )}
  </Dialog>
);

MacroEditorDialog.propTypes = {
  macro: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSalvar: PropTypes.func.isRequired,
  onTestar: PropTypes.func.isRequired,
};

export default MacroEditorDialog;
