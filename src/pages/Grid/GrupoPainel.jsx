import React from 'react';
import PropTypes from 'prop-types';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import {
  RECURSOS_TOKEN,
  ROTULOS_RECURSO,
  corDaBarra,
  fracaoDaBarra,
} from 'common/utils/grid';
import { painelAbaixoDaFaixaSx, painelCabecalhoSx, painelSx } from './styles';

const barraSx = cor => ({
  flex: 1,
  height: 6,
  borderRadius: 3,
  background: 'rgba(255, 255, 255, 0.08)',
  '& .MuiLinearProgress-bar': { background: cor, borderRadius: 3 },
});

const Barra = ({ id, recurso }) => {
  const fracao = fracaoDaBarra(id, recurso);
  const rotulo = ROTULOS_RECURSO[id];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography
        variant="caption"
        sx={{ width: 56, color: 'var(--text-secondary)' }}
      >
        {rotulo}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.round(fracao * 100)}
        aria-label={`${rotulo} ${recurso.atual} de ${recurso.max}`}
        sx={barraSx(corDaBarra(id, fracao))}
      />
      <Typography
        variant="caption"
        sx={{
          minWidth: 52,
          textAlign: 'right',
          color: 'var(--text-primary)',
        }}
      >
        {recurso.atual}/{recurso.max}
      </Typography>
    </Box>
  );
};

Barra.propTypes = {
  id: PropTypes.oneOf(RECURSOS_TOKEN).isRequired,
  recurso: PropTypes.shape({
    atual: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
  }).isRequired,
};

const linhaSx = temToken => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 0.75,
  width: '100%',
  p: 1,
  borderRadius: 2,
  textAlign: 'left',
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-card)',
  opacity: temToken ? 1 : 0.7,
  '&:hover': temToken ? { borderColor: 'var(--border-hover)' } : undefined,
});

/**
 * Painel lateral "Grupo": cada personagem jogável da campanha com avatar,
 * barras de PV/Energia/Fadiga, PP e condições ativas, ao vivo (as linhas
 * vêm de `linhasDoGrupo`, em gridMestre.js). Clicar numa linha cujo
 * personagem tem token na cena aberta seleciona e centraliza o token
 * (`onFocar(token)`).
 */
const GrupoPainel = ({
  linhas,
  selecionadoId = null,
  onFocar,
  onFechar,
  abaixoDaFaixa = false,
}) => (
  <Box
    sx={{
      ...painelSx,
      right: 12,
      ...(abaixoDaFaixa ? painelAbaixoDaFaixaSx : {}),
    }}
    role="region"
    aria-label="Grupo"
  >
    <Box sx={painelCabecalhoSx}>
      <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
        Grupo
      </Typography>
      <IconButton size="small" aria-label="Fechar grupo" onClick={onFechar}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>

    {linhas.length === 0 && (
      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
        Nenhum personagem jogável vinculado a esta campanha.
      </Typography>
    )}

    {linhas.map(linha => {
      const { token } = linha;
      const recursos = RECURSOS_TOKEN.filter(id => linha.recursos?.[id]);
      return (
        <ButtonBase
          key={linha.refId}
          component="div"
          disabled={!token}
          aria-label={
            token
              ? `Selecionar ${linha.nome} no mapa`
              : `${linha.nome} (sem token nesta cena)`
          }
          aria-current={
            token && token.id === selecionadoId ? 'true' : undefined
          }
          title={
            token ? 'Selecionar e centralizar no mapa' : 'Sem token nesta cena'
          }
          onClick={() => token && onFocar(token)}
          sx={linhaSx(Boolean(token))}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar
              src={linha.avatar ?? undefined}
              alt=""
              sx={{ width: 32, height: 32 }}
            >
              {linha.nome?.[0]?.toUpperCase() ?? '?'}
            </Avatar>
            <Typography
              sx={{
                flex: 1,
                minWidth: 0,
                overflowWrap: 'anywhere',
                color: 'var(--text-primary)',
                fontWeight: 600,
              }}
            >
              {linha.nome}
            </Typography>
            {linha.pp && (
              <Typography
                variant="caption"
                sx={{ color: 'var(--color-primary)', whiteSpace: 'nowrap' }}
              >
                PP {linha.pp.atual}/{linha.pp.max}
              </Typography>
            )}
          </Box>

          {linha.semFicha && (
            <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
              Sem dados da ficha (carregando ou indisponível).
            </Typography>
          )}
          {recursos.map(id => (
            <Barra key={id} id={id} recurso={linha.recursos[id]} />
          ))}
          {linha.condicoes.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {linha.condicoes.map(condicao => (
                <Chip
                  key={condicao.id}
                  size="small"
                  label={
                    condicao.stack > 1
                      ? `${condicao.nome} ×${condicao.stack}`
                      : condicao.nome
                  }
                />
              ))}
            </Box>
          )}
        </ButtonBase>
      );
    })}
  </Box>
);

GrupoPainel.propTypes = {
  linhas: PropTypes.arrayOf(
    PropTypes.shape({
      refId: PropTypes.string.isRequired,
      nome: PropTypes.string,
      avatar: PropTypes.string,
      semFicha: PropTypes.bool,
      recursos: PropTypes.object,
      pp: PropTypes.shape({ atual: PropTypes.number, max: PropTypes.number }),
      condicoes: PropTypes.arrayOf(PropTypes.object).isRequired,
      token: PropTypes.shape({ id: PropTypes.string.isRequired }),
    }),
  ).isRequired,
  selecionadoId: PropTypes.string,
  onFocar: PropTypes.func.isRequired,
  onFechar: PropTypes.func.isRequired,
  // Combate em andamento: a faixa de iniciativa ocupa o topo do mapa.
  abaixoDaFaixa: PropTypes.bool,
};

export default GrupoPainel;
