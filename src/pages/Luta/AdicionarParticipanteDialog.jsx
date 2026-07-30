import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { getTipoPersonagem } from 'common/utils/personagemTipo';

const linhaSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1.5,
  p: 1,
  borderRadius: 1.5,
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-primary)',
};

/**
 * Dialog para adicionar NPCs/Criaturas (já vinculados a esta campanha) como
 * participantes da Luta. Cada linha tem sua própria quantidade — permite
 * adicionar várias cópias do mesmo personagem de uma vez (ex.: 5 "Rato
 * Gigante") sem fechar o dialog entre um personagem e outro.
 */
const AdicionarParticipanteDialog = ({
  open,
  onClose,
  personagens,
  onAdicionar,
}) => {
  const [quantidades, setQuantidades] = useState({});

  // Guarda o texto digitado bruto (não o número já validado) — validar a
  // cada tecla forçaria o campo de volta para "1" no meio da digitação
  // sempre que o usuário apaga o dígito para trocar por outro.
  const quantidadeExibida = id => quantidades[id] ?? '1';

  const quantidadeParaAdicionar = id =>
    Math.max(1, Number(quantidadeExibida(id)) || 1);

  const handleQuantidadeChange = (id, valor) => {
    setQuantidades(prev => ({ ...prev, [id]: valor }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
        Adicionar à Luta
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'var(--border-primary)' }}>
        {personagens.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
          >
            Nenhum NPC ou Criatura vinculado a esta campanha ainda. Vincule um
            personagem em NPCs ou Criaturas primeiro.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {personagens.map(personagem => (
              <Box key={personagem.id} sx={linhaSx}>
                {personagem.linkImagem && (
                  <Box
                    component="img"
                    src={personagem.linkImagem}
                    alt={personagem.nome}
                    loading="lazy"
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1,
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: 'var(--text-primary)', fontWeight: 600 }}
                  >
                    {personagem.nome}
                  </Typography>
                  <Chip
                    label={getTipoPersonagem(personagem)}
                    size="small"
                    sx={{
                      mt: 0.25,
                      background:
                        getTipoPersonagem(personagem) === 'NPC'
                          ? 'var(--color-primary)'
                          : '#0e7490',
                      color: '#fff',
                    }}
                  />
                </Box>
                <TextField
                  type="number"
                  size="small"
                  value={quantidadeExibida(personagem.id)}
                  onChange={e =>
                    handleQuantidadeChange(personagem.id, e.target.value)
                  }
                  slotProps={{
                    htmlInput: {
                      min: 1,
                      'aria-label': `Quantidade de ${personagem.nome}`,
                    },
                  }}
                  sx={{ width: 70 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    onAdicionar(
                      personagem,
                      quantidadeParaAdicionar(personagem.id),
                    )
                  }
                  sx={{
                    color: 'var(--color-accent)',
                    borderColor: 'var(--color-accent)',
                  }}
                >
                  Adicionar
                </Button>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: 'var(--text-secondary)',
            '&:hover': { color: 'var(--text-primary)' },
          }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AdicionarParticipanteDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  personagens: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nome: PropTypes.string.isRequired,
      linkImagem: PropTypes.string,
      tipo: PropTypes.string,
    }),
  ).isRequired,
  onAdicionar: PropTypes.func.isRequired,
};

export default AdicionarParticipanteDialog;
