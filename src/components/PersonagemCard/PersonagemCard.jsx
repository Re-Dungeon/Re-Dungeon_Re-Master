import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import {
  resolverValorAtributoPrimario,
  resolverValorAtributoSecundario,
} from 'common/utils/atributosPersonagem';

const cardSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2.5,
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition:
    'transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: 'var(--border-hover)',
    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.24)',
  },
};

const atributoBoxSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0.25,
  alignItems: 'center',
  p: 0.9,
  borderRadius: 1.5,
  background: 'rgba(111, 45, 168, 0.14)',
  border: '1px solid rgba(111, 45, 168, 0.2)',
};

const atributosGridSx = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'repeat(3, minmax(0, 1fr))',
    md: 'repeat(6, minmax(0, 1fr))',
  },
  gap: 0.75,
  mb: 2,
};

const seloCloneTextoSx = {
  color: 'var(--color-accent)',
  display: 'block',
  mb: 1.5,
  fontWeight: 600,
};

const toSafeNumber = value => {
  const numericValue = Number.parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getStatBarWidth = (value, maxValue) => {
  const numericValue = toSafeNumber(value);
  const numericMaxValue = toSafeNumber(maxValue);
  const safeMax = numericMaxValue > 0 ? numericMaxValue : 100;
  const progress = safeMax > 0 ? (numericValue / safeMax) * 100 : 0;
  const clamped = Math.min(100, Math.max(0, progress));
  return clamped > 0 ? `${Math.max(12, clamped)}%` : '8%';
};

const getMaximoAtributo = (personagem, aliases) => {
  const maximos = personagem?.maximosAtributos ?? personagem?.atributosMaximos ?? {};
  const candidato = aliases
    .map(alias => maximos[alias])
    .find(valor => typeof valor === 'number' || typeof valor === 'string');

  if (candidato === undefined || candidato === null || candidato === '') {
    return undefined;
  }

  const numero = toSafeNumber(candidato);
  return numero > 0 ? numero : undefined;
};

const formatarTooltipAtributo = (label, value) => {
  const textoValor = value === undefined || value === null || value === '' ? '—' : String(value);
  return `${label}: ${textoValor}`;
};

const resolverNomeAtributo = label => {
  const nomeNormalizado = String(label ?? '').trim();
  const mapa = {
    FOR: 'Força',
    VIT: 'Vitalidade',
    AGI: 'Agilidade',
    INT: 'Inteligência',
    PER: 'Percepção',
    SOR: 'Sorte',
    PronT: 'Prontidão',
    Pront: 'Prontidão',
    Prontidão: 'Prontidão',
    AtK: 'Ataque',
    Ataque: 'Ataque',
    DeF: 'Defesa',
    Defesa: 'Defesa',
    PreC: 'Precisão',
    Precisão: 'Precisão',
    ReA: 'Reação',
    Reação: 'Reação',
    EvA: 'Evasão',
    Evasão: 'Evasão',
  };

  return (mapa[nomeNormalizado] ?? nomeNormalizado) || 'Atributo';
};

const resolverIconeAtributoSecundario = label => {
  const nomeNormalizado = String(label ?? '').trim();
  const mapa = {
    PronT: '⚡',
    Pront: '⚡',
    Prontidão: '⚡',
    AtK: '⚔',
    Ataque: '⚔',
    DeF: '🛡',
    Defesa: '🛡',
    PreC: '🎯',
    Precisão: '🎯',
    ReA: '👁',
    Reação: '👁',
    EvA: '✦',
    Evasão: '✦',
  };

  return mapa[nomeNormalizado] ?? '✦';
};

// Card compartilhado por NPCs, Criaturas e Jogadores (páginas que listam
// `personagens` do Re-Dungeon vinculados à campanha ativa). As três telas
// divergem em detalhes pontuais — se oferecem "Clonar", se mostram descrição,
// e em qual forma exibem o aviso de clone — por isso esses comportamentos
// são controlados via props em vez de hardcoded aqui.
const PersonagemCard = ({
  personagem,
  clone,
  podeEscrever,
  atributosPrimarios,
  atributosSecundarios,
  onVisualizar,
  onClonar,
  onEditarClone,
  onRemoverClone,
  exibirDescricao,
  seloCloneTopo,
  seloCloneBadge,
  seloCloneRodape,
  visualVariant,
}) => {
  const isPremiumVisual = visualVariant === 'npcs' || visualVariant === 'jogadores' || visualVariant === 'criaturas';

  const primaryAttributeColumns = [
    atributosPrimarios.slice(0, 3),
    atributosPrimarios.slice(3, 6),
  ];

  const statActions = (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      {podeEscrever && !clone && onClonar && (
        <IconButton
          size="small"
          onClick={() => onClonar(personagem)}
          sx={{
            color: 'var(--color-accent)',
            background: 'rgba(111, 45, 168, 0.12)',
            border: '1px solid rgba(111, 45, 168, 0.22)',
            '&:hover': { background: 'rgba(111, 45, 168, 0.2)' },
          }}
          aria-label={`Clonar ${personagem.nome}`}
        >
          <ContentCopyOutlinedIcon fontSize="small" />
        </IconButton>
      )}
      {podeEscrever && clone && (
        <>
          <IconButton
            size="small"
            onClick={() => onEditarClone(personagem, clone)}
            sx={{
              color: 'var(--color-accent)',
              background: 'rgba(111, 45, 168, 0.12)',
              border: '1px solid rgba(111, 45, 168, 0.22)',
              '&:hover': { background: 'rgba(111, 45, 168, 0.2)' },
            }}
            aria-label={`Editar clone de ${personagem.nome}`}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onRemoverClone(clone)}
            sx={{
              color: '#fca5a5',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              '&:hover': { background: 'rgba(239, 68, 68, 0.14)' },
            }}
            aria-label={`Remover clone de ${personagem.nome}`}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </>
      )}
    </Box>
  );

  const duplicarAction =
    podeEscrever && !clone && onClonar ? (
      <Box
        onClick={() => onClonar(personagem)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          minWidth: 150,
          border: '1px solid rgba(118, 139, 255, 0.42)',
          borderRadius: 1.25,
          background: 'linear-gradient(135deg, rgba(118, 139, 255, 0.18), rgba(111, 45, 168, 0.14))',
          color: '#dfe7ff',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          py: 1,
          px: 1.25,
          cursor: 'pointer',
          transition: 'all 220ms ease',
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(118, 139, 255, 0.22), rgba(111, 45, 168, 0.18))',
            boxShadow: '0 0 18px rgba(118, 139, 255, 0.18)',
          },
        }}
        role="button"
        tabIndex={0}
        aria-label={`Clonar ${personagem.nome}`}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClonar(personagem);
          }
        }}
      >
        <ContentCopyOutlinedIcon fontSize="small" />
        <Typography
          variant="button"
          sx={{
            color: '#dfe7ff',
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          Duplicar
        </Typography>
      </Box>
    ) : null;

  if (!isPremiumVisual) {
    return (
      <Paper elevation={0} sx={cardSx}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 1.5,
            gap: 1,
          }}
        >
          <Typography
            variant="h6"
            sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
          >
            {personagem.nome}
          </Typography>
          {statActions}
        </Box>

        {clone && seloCloneTopo && (
          <Typography variant="caption" sx={{ ...seloCloneTextoSx, mb: 1 }}>
            Clonado nesta campanha
          </Typography>
        )}

        <Box
          sx={{
            width: '100%',
            height: 180,
            borderRadius: 2,
            border: '1px solid var(--border-primary)',
            background: 'var(--bg-secondary)',
            overflow: 'hidden',
            mb: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {personagem.linkImagem ? (
            <Box
              component="img"
              src={personagem.linkImagem}
              alt={personagem.nome}
              loading="lazy"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={e => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.75,
                color: 'var(--text-muted)',
              }}
            >
              <ImageOutlinedIcon sx={{ fontSize: 30 }} />
              <Typography variant="caption">Sem imagem</Typography>
            </Box>
          )}

          {clone && seloCloneBadge && (
            <Box
              component="img"
              src="https://i.imgur.com/9jaRlGw.png"
              alt="Clonado nesta campanha"
              sx={{
                position: 'absolute',
                right: -8,
                bottom: -8,
                width: 60,
                height: 60,
                objectFit: 'contain',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4))',
              }}
            />
          )}
        </Box>

        <Box sx={atributosGridSx}>
          {atributosPrimarios.map(({ label, aliases, icon: Icon }) => {
            const valor = resolverValorAtributoPrimario(personagem, aliases);
            return (
              <Box key={label} sx={atributoBoxSx}>
                <Icon sx={{ fontSize: 16, color: 'var(--color-accent)' }} />
                <Typography
                  variant="caption"
                  sx={{ color: 'var(--text-muted)', fontWeight: 700 }}
                >
                  {label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
                >
                  {valor}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box sx={atributosGridSx}>
          {atributosSecundarios.map(({ label, aliases }) => {
            const valor = resolverValorAtributoSecundario(personagem, aliases);
            return (
              <Box key={label} sx={atributoBoxSx}>
                <Typography
                  variant="caption"
                  sx={{ color: 'var(--text-muted)', fontWeight: 700 }}
                >
                  {label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
                >
                  {valor}
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box
          onClick={() => onVisualizar(personagem)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            mt: 1.5,
            width: '100%',
            border: '1px solid rgba(214, 176, 89, 0.46)',
            borderRadius: 1.25,
            background: 'rgba(214, 176, 89, 0.04)',
            color: '#f4d892',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            py: 1.1,
            cursor: 'pointer',
            transition: 'all 220ms ease',
            '&:hover': {
              background: 'rgba(214, 176, 89, 0.09)',
              boxShadow: '0 0 18px rgba(214, 176, 89, 0.18)',
            },
          }}
          role="button"
          tabIndex={0}
          aria-label={`Ver ficha de ${personagem.nome}`}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onVisualizar(personagem);
            }
          }}
        >
          <Typography
            variant="button"
            sx={{
              color: '#f4d892',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            VER FICHA
          </Typography>
          <Typography variant="button" sx={{ color: '#f4d892', fontWeight: 800 }}>→</Typography>
        </Box>

        {exibirDescricao && personagem.descricao && (
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-secondary)', mb: 1.5 }}
          >
            {personagem.descricao}
          </Typography>
        )}

        {clone && seloCloneRodape && (
          <Typography variant="caption" sx={seloCloneTextoSx}>
            Clonado nesta campanha
          </Typography>
        )}
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        ...cardSx,
        position: 'relative',
        background:
          'linear-gradient(180deg, rgba(12, 18, 30, 0.98) 0%, rgba(12, 17, 28, 0.96) 100%)',
        border: '1px solid rgba(214, 176, 89, 0.34)',
        boxShadow: '0 18px 48px rgba(4, 8, 18, 0.58)',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'rgba(214, 176, 89, 0.56)',
          boxShadow: '0 24px 60px rgba(4, 8, 18, 0.68)',
          '& .npc-image': {
            transform: 'scale(1.06)',
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pb: 1.5,
          borderBottom: '1px solid rgba(214, 176, 89, 0.14)',
          textAlign: 'center',
        }}
      >
        <Box sx={{ minWidth: 0, width: '100%' }}>
          <Typography
            variant="h6"
            sx={{
              color: 'var(--text-primary)',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              lineHeight: 1.2,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              hyphens: 'auto',
              textAlign: 'center',
            }}
          >
            {personagem.nome}
          </Typography>
        </Box>
      </Box>

      {clone && seloCloneTopo && (
        <Typography variant="caption" sx={{ ...seloCloneTextoSx, my: 1.5 }}>
          Clonado nesta campanha
        </Typography>
      )}

      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 210,
          borderRadius: 2.5,
          overflow: 'hidden',
          my: 1.5,
          border: '1px solid rgba(111, 142, 180, 0.36)',
          background: 'linear-gradient(180deg, rgba(8, 12, 19, 0.2), rgba(8, 12, 19, 0.9))',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {personagem.linkImagem ? (
          <Box
            className="npc-image"
            component="img"
            src={personagem.linkImagem}
            alt={personagem.nome}
            loading="lazy"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transform: 'scale(1.01)',
              transition: 'transform 220ms ease',
              filter: 'saturate(0.92) contrast(1.08)',
            }}
            onError={e => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              width: '100%',
              height: '100%',
              color: 'var(--text-muted)',
              background:
                'linear-gradient(180deg, rgba(17, 22, 34, 0.7), rgba(9, 12, 20, 0.92))',
            }}
          >
            <ImageOutlinedIcon sx={{ fontSize: 32 }} />
            <Typography variant="caption">Sem imagem</Typography>
          </Box>
        )}

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(5, 8, 15, 0.12) 0%, rgba(5, 8, 15, 0.22) 45%, rgba(5, 8, 15, 0.72) 100%)',
            pointerEvents: 'none',
          }}
        />

        {clone && seloCloneBadge && (
          <Box
            component="img"
            src="https://i.imgur.com/9jaRlGw.png"
            alt="Clonado nesta campanha"
            sx={{
              position: 'absolute',
              right: 12,
              bottom: 10,
              width: 56,
              height: 56,
              objectFit: 'contain',
              pointerEvents: 'none',
              filter: 'drop-shadow(0 6px 18px rgba(0, 0, 0, 0.5))',
            }}
          />
        )}
      </Box>

      <Box
        sx={{
          borderTop: '1px solid rgba(214, 176, 89, 0.14)',
          borderBottom: '1px solid rgba(214, 176, 89, 0.14)',
          py: 1.5,
          mb: 1.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: '#e7c77c',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontWeight: 700,
            mb: 1.25,
          }}
        >
          Atributos
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.25 }}>
          {primaryAttributeColumns.map((column, columnIndex) => (
            <Box key={`coluna-${columnIndex}`} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {column.map(({ label, aliases, icon: Icon }) => {
                const valor = resolverValorAtributoPrimario(personagem, aliases);
                const valorNumerico = toSafeNumber(valor);
                const maximo = getMaximoAtributo(personagem, aliases);
                const showMax = typeof maximo === 'number' && maximo > 0;
                const nomeAtributo = resolverNomeAtributo(label);
                const tooltipTitle = formatarTooltipAtributo(nomeAtributo, showMax ? `${valor} / ${maximo}` : valor);
                return (
                  <Tooltip key={label} title={tooltipTitle} arrow>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ minWidth: 28, display: 'flex', justifyContent: 'flex-start' }}>
                        <Icon sx={{ fontSize: 14, color: '#e7c77c' }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                          <Typography variant="caption" sx={{ color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em' }}>
                            {nomeAtributo}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                            {showMax ? `${valor} / ${maximo}` : valor}
                          </Typography>
                        </Box>
                        <Box sx={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(148, 163, 184, 0.14)', overflow: 'hidden' }}>
                          <Box
                            sx={{
                              width: getStatBarWidth(valorNumerico, maximo),
                              height: '100%',
                              borderRadius: 999,
                              background: 'linear-gradient(90deg, rgba(110, 114, 190, 0.9), rgba(45, 194, 255, 0.85))',
                              boxShadow: '0 0 12px rgba(45, 194, 255, 0.24)',
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          borderBottom: '1px solid rgba(214, 176, 89, 0.14)',
          pb: 1.5,
          mb: 1.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color: '#e7c77c',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontWeight: 700,
            mb: 1,
          }}
        >
          Combate e derivados
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 1.2,
          }}
        >
          {atributosSecundarios.map(({ label, aliases }) => {
            const valor = resolverValorAtributoSecundario(personagem, aliases);
            const labelCompleto = resolverNomeAtributo(label);
            const icone = resolverIconeAtributoSecundario(label);
            return (
              <Tooltip key={label} title={formatarTooltipAtributo(labelCompleto, valor)} arrow>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.6,
                    px: 1,
                    py: 0.45,
                    minWidth: 72,
                    borderRadius: 999,
                    background: 'rgba(122, 137, 163, 0.08)',
                    border: '1px solid rgba(122, 137, 163, 0.18)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#e7c77c', fontWeight: 700 }}>
                    {icone}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                    {valor}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'stretch',
          mt: 1.5,
          width: '100%',
        }}
      >
        <Box
          onClick={() => onVisualizar(personagem)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.75,
            flex: 1,
            border: '1px solid rgba(214, 176, 89, 0.46)',
            borderRadius: 1.25,
            background: 'rgba(214, 176, 89, 0.04)',
            color: '#f4d892',
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            py: 1.1,
            cursor: 'pointer',
            transition: 'all 220ms ease',
            '&:hover': {
              background: 'rgba(214, 176, 89, 0.09)',
              boxShadow: '0 0 18px rgba(214, 176, 89, 0.18)',
            },
          }}
          role="button"
          tabIndex={0}
          aria-label={`Ver ficha de ${personagem.nome}`}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onVisualizar(personagem);
            }
          }}
        >
          <Typography
            variant="button"
            sx={{
              color: '#f4d892',
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            VER FICHA
          </Typography>
          <Typography variant="button" sx={{ color: '#f4d892', fontWeight: 800 }}>→</Typography>
        </Box>

        {clone && podeEscrever ? (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <IconButton
              size="small"
              onClick={() => onEditarClone(personagem, clone)}
              sx={{
                color: 'var(--color-accent)',
                background: 'rgba(111, 45, 168, 0.12)',
                border: '1px solid rgba(111, 45, 168, 0.22)',
                '&:hover': { background: 'rgba(111, 45, 168, 0.2)' },
              }}
              aria-label={`Editar clone de ${personagem.nome}`}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onRemoverClone(clone)}
              sx={{
                color: '#fca5a5',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                '&:hover': { background: 'rgba(239, 68, 68, 0.14)' },
              }}
              aria-label={`Remover clone de ${personagem.nome}`}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          duplicarAction
        )}
      </Box>

      {exibirDescricao && personagem.descricao && (
        <Typography
          variant="body2"
          sx={{ color: 'var(--text-secondary)', mt: 1.5 }}
        >
          {personagem.descricao}
        </Typography>
      )}

      {clone && seloCloneRodape && (
        <Typography variant="caption" sx={seloCloneTextoSx}>
          Clonado nesta campanha
        </Typography>
      )}
    </Paper>
  );
};

PersonagemCard.propTypes = {
  personagem: PropTypes.shape({
    id: PropTypes.string,
    nome: PropTypes.string.isRequired,
    linkImagem: PropTypes.string,
    descricao: PropTypes.string,
    funcao: PropTypes.string,
    cargo: PropTypes.string,
    titulo: PropTypes.string,
    occupacao: PropTypes.string,
  }).isRequired,
  clone: PropTypes.shape({ id: PropTypes.string }),
  podeEscrever: PropTypes.bool,
  atributosPrimarios: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      aliases: PropTypes.arrayOf(PropTypes.string).isRequired,
      icon: PropTypes.elementType.isRequired,
    }),
  ).isRequired,
  atributosSecundarios: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      aliases: PropTypes.arrayOf(PropTypes.string).isRequired,
    }),
  ).isRequired,
  onVisualizar: PropTypes.func.isRequired,
  onClonar: PropTypes.func,
  onEditarClone: PropTypes.func.isRequired,
  onRemoverClone: PropTypes.func.isRequired,
  exibirDescricao: PropTypes.bool,
  seloCloneTopo: PropTypes.bool,
  seloCloneBadge: PropTypes.bool,
  seloCloneRodape: PropTypes.bool,
  visualVariant: PropTypes.oneOf(['npcs']),
};

PersonagemCard.defaultProps = {
  clone: null,
  podeEscrever: false,
  onClonar: null,
  exibirDescricao: false,
  seloCloneTopo: false,
  seloCloneBadge: false,
  seloCloneRodape: false,
  visualVariant: null,
};

export default PersonagemCard;
