import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  AURA_RAIO_MAX,
  AURA_RAIO_MIN,
  CORES_AURA,
  RECURSOS_TOKEN,
  ROTULOS_RECURSO,
  TIPOS_TOKEN,
  TOKEN_CONDICOES_MAX,
  deslocamentoDoToken,
  nomeDaCondicao,
  normalizarAura,
  normalizarCondicoesDoToken,
  normalizarDeslocamento,
  normalizarModoRecursos,
  normalizarRecurso,
} from 'common/utils/grid';
import {
  OPCOES_MOSTRAR_RECURSOS,
  ajustarRecurso,
  auraEscolhida,
  recursoDigitado,
} from './gridMestre';

const igual = (a, b) =>
  (a?.atual ?? null) === (b?.atual ?? null) &&
  (a?.max ?? null) === (b?.max ?? null);

// Campo numérico com rascunho local: mostra o valor do token e só grava no
// blur/Enter (cada tecla não vira uma escrita no Firestore).
const CampoNumero = ({
  label,
  valor,
  onConfirmar,
  disabled,
  inputMode = 'numeric',
  dica,
}) => {
  const [texto, setTexto] = useState(null);
  const confirmar = () => {
    if (texto !== null) onConfirmar(texto);
    setTexto(null);
  };
  return (
    <TextField
      size="small"
      label={label}
      value={texto ?? String(valor ?? '')}
      disabled={disabled}
      onFocus={event => {
        setTexto(String(valor ?? ''));
        event.target.select();
      }}
      onChange={event => setTexto(event.target.value)}
      onBlur={confirmar}
      onKeyDown={event => {
        if (event.key === 'Enter') event.target.blur();
      }}
      slotProps={{ htmlInput: { inputMode, title: dica } }}
      sx={{ flex: 1, minWidth: 0 }}
    />
  );
};

CampoNumero.propTypes = {
  label: PropTypes.string.isRequired,
  valor: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onConfirmar: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  inputMode: PropTypes.string,
  dica: PropTypes.string,
};

// `[−] [atual] / [max] [+]` de um recurso; sem recurso, "Definir PV".
const RecursoLinha = ({ id, recurso, onAlterar }) => {
  const [definindo, setDefinindo] = useState(false);
  const rotulo = ROTULOS_RECURSO[id];

  const gravar = novo => {
    if (!igual(novo, recurso)) onAlterar({ [id]: novo });
  };

  if (!recurso) {
    return definindo ? (
      <CampoNumero
        label={`${rotulo} máximo`}
        valor=""
        onConfirmar={texto => {
          setDefinindo(false);
          const novo = recursoDigitado(null, 'max', texto);
          if (novo) gravar(novo);
        }}
      />
    ) : (
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => setDefinindo(true)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Definir {rotulo}
      </Button>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <IconButton
        size="small"
        aria-label={`Diminuir ${rotulo}`}
        disabled={recurso.atual <= 0}
        onClick={() => gravar(ajustarRecurso(recurso, -1))}
      >
        <RemoveIcon fontSize="small" />
      </IconButton>
      <CampoNumero
        label={`${rotulo} atual`}
        valor={recurso.atual}
        inputMode="text"
        dica="Digite o valor ou -N/+N para tirar/somar (ex.: -7)"
        onConfirmar={texto => gravar(recursoDigitado(recurso, 'atual', texto))}
      />
      <Typography sx={{ color: 'var(--text-muted)' }} aria-hidden="true">
        /
      </Typography>
      <CampoNumero
        label={`${rotulo} máximo`}
        valor={recurso.max}
        onConfirmar={texto => gravar(recursoDigitado(recurso, 'max', texto))}
      />
      <IconButton
        size="small"
        aria-label={`Aumentar ${rotulo}`}
        disabled={recurso.atual >= recurso.max}
        onClick={() => gravar(ajustarRecurso(recurso, 1))}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

RecursoLinha.propTypes = {
  id: PropTypes.oneOf(RECURSOS_TOKEN).isRequired,
  recurso: PropTypes.shape({ atual: PropTypes.number, max: PropTypes.number }),
  onAlterar: PropTypes.func.isRequired,
};

// Resumo somente leitura do token de jogador (vem da ficha ao vivo).
const ResumoDoJogador = ({ detalhe }) => {
  const linhas = [
    ...RECURSOS_TOKEN.filter(id => detalhe?.recursos?.[id]).map(
      id =>
        `${ROTULOS_RECURSO[id]} ${detalhe.recursos[id].atual}/${detalhe.recursos[id].max}`,
    ),
    ...(detalhe?.pp ? [`PP ${detalhe.pp.atual}/${detalhe.pp.max}`] : []),
    ...(detalhe?.condicoes?.length
      ? [
          detalhe.condicoes
            .map(c => (c.stack > 1 ? `${c.nome} ×${c.stack}` : c.nome))
            .join(', '),
        ]
      : []),
  ];
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
        Da ficha do jogador
      </Typography>
      {linhas.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
          Sem PV/Energia/Fadiga nem condições na ficha.
        </Typography>
      ) : (
        linhas.map(linha => (
          <Typography
            key={linha}
            variant="body2"
            sx={{ color: 'var(--text-primary)' }}
          >
            {linha}
          </Typography>
        ))
      )}
    </Box>
  );
};

ResumoDoJogador.propTypes = {
  detalhe: PropTypes.shape({
    recursos: PropTypes.object,
    condicoes: PropTypes.arrayOf(PropTypes.object),
    pp: PropTypes.shape({ atual: PropTypes.number, max: PropTypes.number }),
  }),
};

/**
 * Combate do token selecionado no Grid (dentro do TokenPainel): PV/Energia/
 * Fadiga, o que os jogadores veem deles, condições e aura. Cada controle grava
 * na hora via `onAlterar(patch)` (updateGridToken) — independente do "Salvar
 * token". Token de jogador: recursos e condições vêm da ficha (só leitura
 * aqui); a aura vale para todos os tipos. O sigilo dos recursos é só da
 * interface (o doc do token é legível por quem vê a cena).
 */
const TokenCombate = ({ token, condicoes, detalhe, onAlterar }) => {
  const ehJogador = token.tipo === TIPOS_TOKEN.JOGADOR;
  const catalogoPorId = useMemo(
    () => new Map(condicoes.map(condicao => [condicao.id, condicao])),
    [condicoes],
  );
  const idsDoToken = normalizarCondicoesDoToken(token.condicoes);
  const conhecidas = idsDoToken.filter(id => catalogoPorId.has(id));
  const desconhecidas = idsDoToken.filter(id => !catalogoPorId.has(id));
  const aura = normalizarAura(token.aura);
  const deslocamento = deslocamentoDoToken(token);

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}
      role="group"
      aria-label="Combate"
    >
      <Typography
        variant="overline"
        sx={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}
      >
        Combate
      </Typography>

      {ehJogador ? (
        <ResumoDoJogador detalhe={detalhe} />
      ) : (
        <>
          {RECURSOS_TOKEN.map(id => (
            <RecursoLinha
              key={id}
              id={id}
              recurso={normalizarRecurso(token[id])}
              onAlterar={onAlterar}
            />
          ))}
          <TextField
            select
            size="small"
            label="Jogadores veem os recursos"
            value={normalizarModoRecursos(token.mostrarRecursos)}
            onChange={event =>
              onAlterar({ mostrarRecursos: event.target.value })
            }
          >
            {OPCOES_MOSTRAR_RECURSOS.map(opcao => (
              <MenuItem key={opcao.value} value={opcao.value}>
                {opcao.label}
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete
            multiple
            size="small"
            options={condicoes.map(condicao => condicao.id)}
            value={conhecidas}
            getOptionLabel={id => nomeDaCondicao(catalogoPorId.get(id))}
            getOptionDisabled={id =>
              conhecidas.length >= TOKEN_CONDICOES_MAX &&
              !conhecidas.includes(id)
            }
            onChange={(_event, ids) =>
              onAlterar({
                condicoes: [...ids, ...desconhecidas].slice(
                  0,
                  TOKEN_CONDICOES_MAX,
                ),
              })
            }
            noOptionsText="Nenhuma condição neste universo"
            renderInput={params => <TextField {...params} label="Condições" />}
          />
        </>
      )}

      <CampoNumero
        label="Deslocamento (m)"
        valor={String(deslocamento).replace('.', ',')}
        inputMode="decimal"
        onConfirmar={texto => {
          const novo = normalizarDeslocamento(texto);
          if (novo !== null && novo !== deslocamento) {
            onAlterar({ deslocamento: novo });
          }
        }}
      />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          select
          size="small"
          label="Aura"
          value={aura?.cor ?? ''}
          onChange={event =>
            onAlterar({
              aura: auraEscolhida(event.target.value, aura?.raio ?? 1),
            })
          }
          slotProps={{
            select: { displayEmpty: true },
            inputLabel: { shrink: true },
          }}
          sx={{ flex: 2, minWidth: 0 }}
        >
          <MenuItem value="">Sem aura</MenuItem>
          {CORES_AURA.map(cor => (
            <MenuItem key={cor.valor} value={cor.valor}>
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  width: 12,
                  height: 12,
                  mr: 1,
                  borderRadius: '50%',
                  background: cor.valor,
                  display: 'inline-block',
                }}
              />
              {cor.rotulo}
            </MenuItem>
          ))}
        </TextField>
        <CampoNumero
          label="Raio (q)"
          valor={aura?.raio ?? ''}
          disabled={!aura}
          onConfirmar={texto => {
            const nova = auraEscolhida(aura?.cor, texto);
            if (nova && nova.raio !== aura?.raio) onAlterar({ aura: nova });
          }}
        />
      </Box>
      {aura && (
        <Typography
          variant="caption"
          sx={{ color: 'var(--text-muted)', mt: -1 }}
        >
          Raio em quadrados ({AURA_RAIO_MIN}–{AURA_RAIO_MAX}), contado da borda
          do token.
        </Typography>
      )}
    </Box>
  );
};

TokenCombate.propTypes = {
  token: PropTypes.shape({
    tipo: PropTypes.string,
    pv: PropTypes.object,
    energia: PropTypes.object,
    fadiga: PropTypes.object,
    mostrarRecursos: PropTypes.string,
    condicoes: PropTypes.arrayOf(PropTypes.string),
    aura: PropTypes.shape({ raio: PropTypes.number, cor: PropTypes.string }),
    deslocamento: PropTypes.number,
  }).isRequired,
  condicoes: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired }),
  ).isRequired,
  detalhe: PropTypes.shape({
    recursos: PropTypes.object,
    condicoes: PropTypes.arrayOf(PropTypes.object),
    pp: PropTypes.shape({ atual: PropTypes.number, max: PropTypes.number }),
  }),
  onAlterar: PropTypes.func.isRequired,
};

export default TokenCombate;
