import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';

import {
  descreverMensagemCombate,
  formatarHorarioMensagem,
} from 'common/utils/chat';

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
  const { titulo, iniciativa, linhas } = descreverMensagemCombate(
    mensagem.combate,
  );
  const horario = formatarHorarioMensagem(mensagem.createdAt);

  return (
    <CombateLinha
      data-testid="chat-mensagem"
      data-combate={mensagem.combate?.evento}
    >
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
              onClick={() => onApagar(mensagem)}
              sx={{ color: 'var(--text-muted)' }}
            >
              <DeleteOutlineIcon fontSize="inherit" />
            </IconButton>
          </MensagemAcoes>
        )}
      </CombateCartao>
    </CombateLinha>
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
    createdAt: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.instanceOf(Date),
    ]),
  }).isRequired,
  podeApagar: PropTypes.bool.isRequired,
  onApagar: PropTypes.func.isRequired,
};

export default CombateMensagem;
