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
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import { formatarHorarioMensagem, rotuloPersona } from 'common/utils/chat';
import { criticoDoResultado, resumoRolagem } from 'common/utils/dados';

import DadoIcone from './DadoIcone';
import {
  EtiquetaSecreta,
  MensagemAcoes,
  MensagemHorario,
  MensagemPersona,
  ResultadoDado,
  RolagemAutor,
  RolagemDetalhe,
  RolagemExpressao,
  RolagemLinha,
  RolagemRotulo,
  RolagemTotal,
} from './styles';

const comSinal = valor => (valor < 0 ? ` - ${-valor}` : ` + ${valor}`);

// "{[4, 3] + [2] + 3 - 1}" — mesmo texto de detalheRolagem (common/utils/dados.js),
// mas com cada resultado num <span> para destacar 20/1 naturais no d20.
const Detalhe = ({ rolagem }) => (
  <RolagemDetalhe>
    {'{'}
    {rolagem.grupos.map((grupo, indiceGrupo) => (
      // Índice como key: grupos/resultados são imutáveis depois de rolados.
      <React.Fragment key={indiceGrupo}>
        {indiceGrupo > 0 && ' + '}[
        {grupo.resultados.map((resultado, indice) => (
          <React.Fragment key={indice}>
            {indice > 0 && ', '}
            <ResultadoDado $critico={criticoDoResultado(grupo.faces, resultado)}>
              {resultado}
            </ResultadoDado>
          </React.Fragment>
        ))}
        ]
      </React.Fragment>
    ))}
    {rolagem.termos.map(comSinal).join('')}
    {'}'}
  </RolagemDetalhe>
);

Detalhe.propTypes = {
  rolagem: PropTypes.shape({
    grupos: PropTypes.arrayOf(PropTypes.object).isRequired,
    termos: PropTypes.arrayOf(PropTypes.number).isRequired,
  }).isRequired,
};

// Linha compacta: 🎲 Wesley Chase rolou 1d6 + 8 = 14 {[6] + 8}
const RolagemMensagem = ({ mensagem, podeApagar, onApagar }) => {
  const { rolagem, autorNome, isMestre, secreta, createdAt, rotulo } = mensagem;
  const persona = rotuloPersona(mensagem);
  const [confirmacaoExclusaoAberta, setConfirmacaoExclusaoAberta] = useState(false);

  const confirmarExclusao = () => {
    onApagar(mensagem);
    setConfirmacaoExclusaoAberta(false);
  };

  return (
    <>
      <RolagemLinha $secreta={Boolean(secreta)} data-testid="chat-mensagem">
      <DadoIcone
        faces={rolagem.grupos[0]?.faces ?? 20}
        sx={{ fontSize: 20, color: 'var(--color-primary)' }}
      />
      {secreta && (
        <EtiquetaSecreta>
          <LockOutlinedIcon sx={{ fontSize: 12 }} />
          secreta
        </EtiquetaSecreta>
      )}
      {/* {' '} entre os itens: o flex ignora espaços soltos (o visual vem do
          gap), mas eles mantêm o texto legível ao copiar e para leitores de tela. */}
      <RolagemAutor $mestre={isMestre}>{autorNome}</RolagemAutor>{' '}
      {persona && <MensagemPersona>{persona}</MensagemPersona>}{' '}
      {rotulo ? (
        <>
          <span>—</span> <RolagemRotulo>{rotulo}</RolagemRotulo> <span>·</span>
        </>
      ) : (
        <span>rolou</span>
      )}{' '}
      <RolagemExpressao>{resumoRolagem(rolagem)}</RolagemExpressao> <span>=</span>{' '}
      <RolagemTotal>{rolagem.total}</RolagemTotal> <Detalhe rolagem={rolagem} />{' '}
      <MensagemHorario>{formatarHorarioMensagem(createdAt)}</MensagemHorario>
        {podeApagar && (
          <MensagemAcoes
            className="chat-acoes"
            style={{ top: '50%', transform: 'translateY(-50%)' }}
          >
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
      </RolagemLinha>

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

RolagemMensagem.propTypes = {
  mensagem: PropTypes.shape({
    rolagem: PropTypes.shape({
      grupos: PropTypes.arrayOf(PropTypes.object).isRequired,
      termos: PropTypes.arrayOf(PropTypes.number).isRequired,
      total: PropTypes.number.isRequired,
    }).isRequired,
    autorNome: PropTypes.string,
    isMestre: PropTypes.bool,
    persona: PropTypes.string,
    secreta: PropTypes.bool,
    rotulo: PropTypes.string,
    createdAt: PropTypes.oneOfType([PropTypes.object, PropTypes.instanceOf(Date)]),
  }).isRequired,
  podeApagar: PropTypes.bool.isRequired,
  onApagar: PropTypes.func.isRequired,
};

export default RolagemMensagem;
