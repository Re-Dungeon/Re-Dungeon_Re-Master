import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

import { descreverMensagemCombate, formatarHorarioMensagem } from 'common/utils/chat';

import {
  CombateCartao,
  CombateIniciativa,
  CombateLinha,
  CombateRodape,
  CombateTexto,
  CombateTitulo,
  MensagemAcoes,
} from './styles';

// Mensagem de combate do grid (início com a iniciativa, rodada, turno, fim):
// cartão estreito no centro do chat, com quem fez a ação no rodapé. Cópia nos
// dois sites — mudou um, mude o outro.
const CombateMensagem = ({ mensagem, podeApagar, onApagar }) => {
  const { titulo, iniciativa, linhas } = descreverMensagemCombate(mensagem.combate);
  const horario = formatarHorarioMensagem(mensagem.createdAt);
  const [confirmacaoExclusaoAberta, setConfirmacaoExclusaoAberta] = useState(false);

  const confirmarExclusao = () => {
    onApagar(mensagem);
    setConfirmacaoExclusaoAberta(false);
  };

  return (
    <>
      <CombateLinha data-testid="chat-mensagem" data-combate={mensagem.combate?.evento}>
        <CombateCartao>
        <CombateTitulo>
          <span aria-hidden="true">⚔</span> {titulo}
        </CombateTitulo>
        {iniciativa?.length > 0 && (
          <CombateIniciativa aria-label="Iniciativa">
            {/* Índice como key: a lista é imutável depois de enviada. */}
            {iniciativa.map((linha, indice) => (
              <li key={indice}>{linha}</li>
            ))}
          </CombateIniciativa>
        )}
        {linhas.map(linha => (
          <CombateTexto key={linha}>{linha}</CombateTexto>
        ))}
        <CombateRodape>
          {[mensagem.autorNome, horario].filter(Boolean).join(' · ')}
        </CombateRodape>

          {podeApagar && (
            <MensagemAcoes className="chat-acoes">
              <IconButton
                size="small"
                aria-label="Apagar mensagem"
                onClick={() => setConfirmacaoExclusaoAberta(true)}
                sx={{ color: 'var(--text-muted)' }}
              >
                <DeleteOutlineIcon fontSize="inherit" />
              </IconButton>
            </MensagemAcoes>
          )}
        </CombateCartao>
      </CombateLinha>

      <Dialog
        open={confirmacaoExclusaoAberta}
        onClose={() => setConfirmacaoExclusaoAberta(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              border: '1px solid rgba(232, 203, 133, 0.4)',
              background: 'linear-gradient(180deg, rgba(15, 13, 23, 0.98), rgba(10, 10, 18, 0.98))',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
            },
          },
        }}
      >
        <DialogTitle sx={{ color: 'var(--color-primary)', fontWeight: 800, pb: 1.5 }}>
          Excluir mensagem?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'var(--text-secondary)', fontSize: '0.96rem' }}>
            Essa ação remove a mensagem do chat e não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={() => setConfirmacaoExclusaoAberta(false)}
            sx={{ color: 'var(--text-secondary)' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmarExclusao}
            variant="contained"
            color="error"
            sx={{ borderRadius: 999, px: 2.25, fontWeight: 700 }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

CombateMensagem.propTypes = {
  mensagem: PropTypes.shape({
    autorNome: PropTypes.string,
    combate: PropTypes.shape({
      evento: PropTypes.string,
      rodada: PropTypes.number,
      nome: PropTypes.string,
      oculto: PropTypes.bool,
      iniciativa: PropTypes.arrayOf(PropTypes.object),
    }),
    createdAt: PropTypes.oneOfType([PropTypes.object, PropTypes.instanceOf(Date)]),
  }).isRequired,
  podeApagar: PropTypes.bool.isRequired,
  onApagar: PropTypes.func.isRequired,
};

export default CombateMensagem;
