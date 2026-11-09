import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import MacroEditorDialog from './MacroEditorDialog';
import { MacroItem } from './styles';

// Modal das macros da campanha. Todos veem nome (+ descrição) e "Usar"; o
// mestre (`podeGerenciar`) também adiciona, edita, apaga e reordena — as
// regras do Firestore garantem isso, a UI só esconde os botões.
const MacrosDialog = ({ open, onClose, macros, onUsar }) => {
  // undefined = editor fechado; null = nova macro; objeto = editando.
  const [macroEditada, setMacroEditada] = useState(undefined);
  const { lista, carregando, podeGerenciar, rodando, salvar, apagar, mover, testar } = macros;

  const usar = macro => {
    onClose();
    onUsar(macro);
  };

  const confirmarApagar = macro => {
    if (window.confirm(`Apagar a macro "${macro.nome}"?`)) apagar(macro).catch(() => {});
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pr: 6 }}>
          Macros da campanha
          <IconButton
            aria-label="Fechar"
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'var(--text-muted)' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {podeGerenciar && (
            <Button variant="outlined" onClick={() => setMacroEditada(null)} sx={{ alignSelf: 'flex-start', mb: 1 }}>
              + Adicionar macro
            </Button>
          )}

          {carregando && <CircularProgress size={24} sx={{ alignSelf: 'center', color: 'var(--color-primary)' }} />}
          {!carregando && lista.length === 0 && (
            <Typography sx={{ color: 'var(--text-muted)', textAlign: 'center', py: 3 }}>
              {podeGerenciar ? 'Nenhuma macro ainda. Adicione a primeira!' : 'O mestre ainda não criou macros.'}
            </Typography>
          )}

          {lista.map((macro, indice) => (
            <MacroItem key={macro.id}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, overflowWrap: 'anywhere' }}>
                  {macro.nome}
                  {podeGerenciar && macro.somenteMestre && (
                    <Chip label="só mestre" size="small" variant="outlined" sx={{ ml: 1, height: 20 }} />
                  )}
                </Typography>
                {macro.descricao && (
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    {macro.descricao}
                  </Typography>
                )}
              </Box>

              {podeGerenciar && (
                <>
                  <Tooltip title="Subir">
                    <span>
                      <IconButton
                        size="small"
                        aria-label={`Subir ${macro.nome}`}
                        disabled={indice === 0}
                        onClick={() => mover(indice, -1).catch(() => {})}
                      >
                        <ArrowUpwardIcon fontSize="inherit" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Descer">
                    <span>
                      <IconButton
                        size="small"
                        aria-label={`Descer ${macro.nome}`}
                        disabled={indice === lista.length - 1}
                        onClick={() => mover(indice, 1).catch(() => {})}
                      >
                        <ArrowDownwardIcon fontSize="inherit" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton size="small" aria-label={`Editar ${macro.nome}`} onClick={() => setMacroEditada(macro)}>
                      <EditOutlinedIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Apagar">
                    <IconButton size="small" aria-label={`Apagar ${macro.nome}`} onClick={() => confirmarApagar(macro)}>
                      <DeleteOutlineIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </>
              )}

              <Button
                size="small"
                variant="contained"
                startIcon={<PlayArrowIcon />}
                disabled={Boolean(rodando)}
                onClick={() => usar(macro)}
                aria-label={`Usar ${macro.nome}`}
              >
                Usar
              </Button>
            </MacroItem>
          ))}
        </DialogContent>
      </Dialog>

      {podeGerenciar && (
        <MacroEditorDialog
          macro={macroEditada}
          onClose={() => setMacroEditada(undefined)}
          onSalvar={valores => salvar({ ...valores, id: macroEditada?.id })}
          onTestar={testar}
        />
      )}
    </>
  );
};

MacrosDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  macros: PropTypes.shape({
    lista: PropTypes.arrayOf(PropTypes.object).isRequired,
    carregando: PropTypes.bool,
    podeGerenciar: PropTypes.bool,
    rodando: PropTypes.string,
    salvar: PropTypes.func,
    apagar: PropTypes.func,
    mover: PropTypes.func,
    testar: PropTypes.func,
  }).isRequired,
  onUsar: PropTypes.func.isRequired,
};

export default MacrosDialog;
