/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import StarIcon from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarBorder';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

const DEFAULT_CENA_IMAGE =
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1200&q=80';

const ESTADO_DE_TEXTO = {
  nao_iniciado: 'Não iniciada',
  em_andamento: 'Em andamento',
  concluido: 'Concluída',
  ignorado: 'Ignorada',
  cancelado: 'Cancelada',
};

const construirValores = cena => ({
  titulo: cena?.titulo || '',
  resumo: cena?.resumo || 'Resumo da situação da Cena...',
  objetivo: cena?.objetivo || 'Descobrir a verdade por trás da situação atual.',
  descricaoNarracao:
    cena?.descricaoNarracao ||
    'A cidade está coberta pela noite e o silêncio pesa sobre os personagens.',
  improvisacaoNotas:
    cena?.improvisacaoNotas || 'O Mestre pode improvisar uma presença ameaçadora.',
  estado: cena?.estado || 'em_andamento',
  pontosImportantes: Array.isArray(cena?.pontosImportantes)
    ? cena.pontosImportantes
    : ['Segredo da torre', 'Tempo apertado'],
  npcsParticipantes: Array.isArray(cena?.npcsParticipantes)
    ? cena.npcsParticipantes
    : [],
  criaturasEnvolvidas: Array.isArray(cena?.criaturasEnvolvidas)
    ? cena.criaturasEnvolvidas
    : [],
  consequencias: Array.isArray(cena?.consequencias) ? cena.consequencias : [],
});

const numeroDaCena = cena => {
  const numero =
    Number.isInteger(cena?.numeroCena) ? cena.numeroCena :
    Number.isInteger(cena?.numero) ? cena.numero :
    1;
  return `CENA ${String(numero).padStart(2, '0')}`;
};

const CenaDetailPanel = ({
  cena = null,
  podeEscrever,
  ehCenaAtual = false,
  onClose,
  onSave,
  onDelete,
  onMarcarCenaAtual = () => {},
}) => {
  const aberto = Boolean(cena);
  const [modoNarracao, setModoNarracao] = useState(false);
  const [formValues, setFormValues] = useState(() => construirValores(cena));
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormValues(construirValores(cena));
  }, [cena]);

  const statusLabel = useMemo(
    () => ESTADO_DE_TEXTO[formValues.estado] || 'Em andamento',
    [formValues.estado],
  );

  const handleChange = event => {
    const { name, value } = event.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!cena) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await onSave(cena.id, formValues);
    } catch (error) {
      const mensagemPadrao = 'Não foi possível salvar as alterações desta cena.';
      const mensagemErro =
        error?.message === 'permission-denied' ||
        error?.code === 'permission-denied'
          ? mensagemPadrao
          : error?.message || mensagemPadrao;

      setSubmitError(mensagemErro);
    } finally {
      setIsSubmitting(false);
    }
  };

  const navItems = [
    'Visão Geral',
    'Contexto',
    'Narração',
    'Guia do Mestre',
    'NPCs',
    'Criaturas',
    'Missões',
    'Consequências',
    'Improviso',
    'Desfecho',
  ];

  return (
    <Modal
      open={aberto}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 300,
          sx: {
            bgcolor: 'rgba(1,5,12,0.74)',
            backdropFilter: 'blur(8px)',
          },
        },
      }}
      aria-labelledby="cena-modal-title"
      aria-describedby="cena-modal-description"
    >
      <Fade in={aberto} timeout={300}>
        <Box
          sx={{
            position: 'fixed',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: 'calc(100% - 28px)', md: 1270 },
            maxHeight: '92vh',
            outline: 'none',
            borderRadius: '24px',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            background: 'rgba(4, 10, 20, 0.94)',
            boxShadow: '0 36px 90px rgba(2,6,23,0.8)',
            overflow: 'hidden',
          }}
        >
          {aberto && (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '92vh' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: { xs: 2, md: 3 },
                  py: 1.5,
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(11,17,29,0.9)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography
                  id="cena-modal-title"
                  sx={{
                    color: 'var(--text-primary)',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    fontSize: { xs: '0.78rem', md: '0.82rem' },
                  }}
                >
                  Central de Narração
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {ehCenaAtual ? (
                    <Chip
                      icon={<StarIcon sx={{ color: '#050816 !important' }} fontSize="small" />}
                      label="Cena Atual"
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #d4af37, #f7d77b)',
                        color: '#050816',
                        fontWeight: 800,
                        '& .MuiChip-label': { px: 1.25 },
                      }}
                    />
                  ) : (
                    podeEscrever && (
                      <Button
                        size="small"
                        startIcon={<StarOutlineIcon fontSize="small" />}
                        onClick={() => onMarcarCenaAtual(cena.id)}
                        sx={{
                          color: '#f4d98a',
                          border: '1px solid rgba(244,217,138,0.35)',
                          borderRadius: '999px',
                          textTransform: 'none',
                          fontWeight: 700,
                        }}
                      >
                        Marcar como Cena Atual
                      </Button>
                    )
                  )}

                  {podeEscrever && (
                    <IconButton
                      onClick={() => onDelete(cena.id)}
                      aria-label={`Remover cena ${cena.titulo}`}
                      sx={{ color: '#f87171', background: 'rgba(248,113,113,0.08)' }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}

                  <IconButton
                    onClick={onClose}
                    aria-label="Fechar modal da cena"
                    sx={{ color: 'var(--text-secondary)' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '300px minmax(0, 1fr)' }, overflow: 'hidden', flex: 1 }}>
                <Box
                  sx={{
                    background: 'linear-gradient(180deg, rgba(7,14,24,0.96), rgba(9,13,24,0.88))',
                    borderRight: { lg: '1px solid rgba(255,255,255,0.08)' },
                    p: { xs: 2, md: 2.5 },
                    overflowY: 'auto',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: 2,
                    }}
                  >
                    <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.74rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {numeroDaCena(cena)}
                    </Typography>
                    <Chip
                      label={statusLabel}
                      size="small"
                      sx={{
                        background: 'rgba(87, 112, 221, 0.12)',
                        color: '#9cc3ff',
                        border: '1px solid rgba(156,195,255,0.18)',
                      }}
                    />
                  </Box>

                  <Box
                    component="img"
                    src={cena?.linkImagem || DEFAULT_CENA_IMAGE}
                    alt={cena?.titulo || 'Cena'}
                    sx={{
                      width: '100%',
                      height: 220,
                      objectFit: 'cover',
                      borderRadius: '18px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      mb: 2,
                    }}
                  />

                  <Typography variant="h4" sx={{ color: 'var(--text-primary)', fontWeight: 900, lineHeight: 1.1, mb: 1 }}>
                    {cena?.titulo || 'Cena'}
                  </Typography>

                  <Typography sx={{ color: 'var(--text-secondary)', lineHeight: 1.7, mb: 2 }}>
                    {formValues.resumo}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => setModoNarracao(true)}
                      sx={{
                        background: 'linear-gradient(135deg, #d5a84f, #f0d081)',
                        color: '#050816',
                        fontWeight: 800,
                        borderRadius: '12px',
                        textTransform: 'none',
                        boxShadow: '0 16px 30px rgba(213,168,79,0.22)',
                      }}
                    >
                      Narrar Cena
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => setModoNarracao(false)}
                      sx={{
                        color: 'var(--text-primary)',
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        textTransform: 'none',
                      }}
                    >
                      Editar
                    </Button>
                    <IconButton aria-label="Mais ações da cena" sx={{ color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <MoreHorizIcon />
                    </IconButton>
                  </Box>

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />

                  <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', mb: 1.5 }}>
                    Navegação rápida
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    {navItems.map(item => (
                      <Button
                        key={item}
                        size="small"
                        sx={{
                          justifyContent: 'flex-start',
                          color: 'var(--text-secondary)',
                          textTransform: 'none',
                          borderRadius: '10px',
                          px: 1.25,
                          py: 0.75,
                          background: 'rgba(255,255,255,0.02)',
                          '&:hover': { background: 'rgba(92,123,255,0.08)', color: 'var(--text-primary)' },
                        }}
                      >
                        {item}
                      </Button>
                    ))}
                  </Box>
                </Box>

                <Box sx={{ overflowY: 'auto', p: { xs: 2, md: 3 }, background: 'rgba(3,7,16,0.72)' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      background: 'rgba(11,17,29,0.9)',
                      border: '1px solid rgba(148,163,184,0.1)',
                      borderRadius: '18px',
                      p: { xs: 2, md: 2.5 },
                      mb: 2.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography sx={{ color: '#f4d98a', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                        Contexto
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
                      <Box sx={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', p: 2 }}>
                        <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 1 }}>O que aconteceu antes?</Typography>
                        <Typography sx={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                          Há sinais de intrusão no distrito e a cidade se prepara para a próxima mudança de regime.
                        </Typography>
                      </Box>
                      <Box sx={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', p: 2 }}>
                        <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 1 }}>Por que essa Cena começa?</Typography>
                        <Typography sx={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                          A descoberta da presença estranha na torre impulsiona a ação dos personagens em direção ao confronto.
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5 }}>
                    <Paper elevation={0} sx={{ background: 'rgba(11,17,29,0.9)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '18px', p: 2.5 }}>
                      <Typography sx={{ color: '#f4d98a', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem', mb: 1.5 }}>Objetivo</Typography>
                      <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 1 }}>Objetivo principal</Typography>
                      <Typography sx={{ color: 'var(--text-secondary)', lineHeight: 1.8, mb: 2 }}>{formValues.objetivo}</Typography>
                      <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 1 }}>Objetivos secundários</Typography>
                      <Box component="ul" sx={{ pl: 2.5, m: 0, color: 'var(--text-secondary)', lineHeight: 1.9 }}>
                        <li>Desvendar a origem do sinal.</li>
                        <li>Estabelecer contato com os envolvidos.</li>
                        <li>Avaliar riscos antes do confronto.</li>
                      </Box>
                    </Paper>

                    <Paper elevation={0} sx={{ background: 'rgba(11,17,29,0.9)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '18px', p: 2.5 }}>
                      <Typography sx={{ color: '#f4d98a', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem', mb: 1.5 }}>Estado inicial</Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.25 }}>
                        {[
                          ['Local', 'Cidade de A Cidade e Seus Segredos'],
                          ['Horário', 'Noite'],
                          ['Clima', 'Neblina e frio'],
                          ['Situação', 'Ofegante e cautelosa'],
                        ].map(([label, value]) => (
                          <Box key={label} sx={{ background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.12)', borderRadius: '12px', p: 1.25 }}>
                            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>{label}</Typography>
                            <Typography sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Box>

                  <Paper
                    elevation={0}
                    sx={{
                      background: 'rgba(10,16,27,0.95)',
                      border: '1px solid rgba(148,163,184,0.1)',
                      borderRadius: '20px',
                      p: { xs: 2, md: 2.5 },
                      mt: 2.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography sx={{ color: '#f4d98a', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem' }}>NARRAÇÃO</Typography>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => setModoNarracao(!modoNarracao)}
                        sx={{ color: 'var(--color-accent)', textTransform: 'none', fontWeight: 700 }}
                      >
                        {modoNarracao ? 'Preparação' : 'Modo Narração'}
                      </Button>
                    </Box>

                    {modoNarracao ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ background: 'rgba(125,211,252,0.04)', border: '1px solid rgba(125,211,252,0.18)', borderRadius: '14px', p: 2 }}>
                          <Typography sx={{ color: '#8ec9ff', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>Abertura</Typography>
                          <Typography sx={{ color: 'var(--text-primary)', lineHeight: 1.8 }}>{formValues.descricaoNarracao}</Typography>
                        </Box>
                        <Box sx={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', p: 2 }}>
                          <Typography sx={{ color: '#f4d98a', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>Momento 01</Typography>
                          <Typography sx={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            Uma presença surge atrás dos personagens enquanto a cidade aguarda o próximo passo.
                          </Typography>
                        </Box>
                        <Box sx={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', p: 2 }}>
                          <Typography sx={{ color: '#f4d98a', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>Momento 02</Typography>
                          <Typography sx={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            A verdade se revela aos poucos, e cada decisão pode alterar a direção da cena.
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography sx={{ color: 'var(--text-primary)', lineHeight: 1.9 }}>{formValues.descricaoNarracao}</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {formValues.pontosImportantes.map(item => (
                            <Chip key={item} label={item} sx={{ background: 'rgba(196,58,47,0.08)', color: '#f5b38a', border: '1px solid rgba(196,58,47,0.16)' }} />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Paper>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5, mt: 2.5 }}>
                    <Paper elevation={0} sx={{ background: 'rgba(11,17,29,0.9)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '18px', p: 2.5 }}>
                      <Typography sx={{ color: '#f4d98a', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem', mb: 2 }}>Guia do Mestre</Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', p: 2 }}>
                          <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 1 }}>Pontos importantes</Typography>
                          <Box component="ul" sx={{ pl: 2.5, m: 0, color: 'var(--text-secondary)', lineHeight: 1.9 }}>
                            {formValues.pontosImportantes.map(item => (
                              <li key={item}>{item}</li>
                            ))}
                          </Box>
                        </Box>
                        <Box sx={{ background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.18)', borderRadius: '14px', p: 2 }}>
                          <Typography sx={{ color: '#d8b4fe', fontWeight: 700, mb: 1 }}>Segredos</Typography>
                          <Typography sx={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            O que foi encontrado na torre não é apenas um artefato, mas um dispositivo de comunicação com uma antiga presença.
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>

                    <Paper elevation={0} sx={{ background: 'rgba(11,17,29,0.9)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '18px', p: 2.5 }}>
                      <Typography sx={{ color: '#f4d98a', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem', mb: 2 }}>Elementos da Cena</Typography>
                      <Box sx={{ display: 'grid', gap: 1.5 }}>
                        {[
                          { titulo: 'NPCs', valor: formValues.npcsParticipantes.length || 0, subtitulo: 'Presentes na cena' },
                          { titulo: 'Criaturas', valor: formValues.criaturasEnvolvidas.length || 0, subtitulo: 'Encontros relevantes' },
                          { titulo: 'Missões', valor: 1, subtitulo: 'Relacionadas à cena' },
                        ].map(item => (
                          <Box key={item.titulo} sx={{ background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', p: 2 }}>
                            <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}>{item.titulo}</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
                              <Typography sx={{ color: 'var(--text-primary)', fontSize: '1.6rem', fontWeight: 900 }}>{item.valor}</Typography>
                              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.subtitulo}</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5, mt: 2.5 }}>
                    <Paper elevation={0} sx={{ background: 'rgba(11,17,29,0.9)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '18px', p: 2.5, borderLeft: '4px solid rgba(239,68,68,0.8)' }}>
                      <Typography sx={{ color: '#fca5a5', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem', mb: 1.5 }}>Consequências</Typography>
                      <Typography sx={{ color: 'var(--text-secondary)', lineHeight: 1.8, mb: 2 }}>
                        As decisões dos jogadores podem alterar o desenvolvimento da história.
                      </Typography>
                      <Button variant="contained" sx={{ background: 'linear-gradient(135deg, rgba(127,29,29,0.95), rgba(185,28,28,0.95))', color: '#fff', borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}>
                        Gerenciar Consequências
                      </Button>
                    </Paper>

                    <Paper elevation={0} sx={{ background: 'rgba(11,17,29,0.9)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '18px', p: 2.5, borderLeft: '4px solid rgba(168,85,247,0.8)' }}>
                      <Typography sx={{ color: '#d8b4fe', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem', mb: 1.5 }}>Improviso</Typography>
                      <Typography sx={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>{formValues.improvisacaoNotas}</Typography>
                    </Paper>
                  </Box>

                  <Paper elevation={0} sx={{ background: 'rgba(11,17,29,0.9)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '18px', p: 2.5, mt: 2.5 }}>
                    <Typography sx={{ color: '#f4d98a', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem', mb: 1.5 }}>Desfecho da Cena</Typography>
                    <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 1 }}>Como a cena normalmente termina</Typography>
                    <Typography sx={{ color: 'var(--text-secondary)', lineHeight: 1.9 }}>
                      O grupo sai da praça com a primeira pista, porém o verdadeiro perigo ainda não foi revelado e a cidade continua em alerta.
                    </Typography>
                  </Paper>

                  {podeEscrever && (
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, p: 2.5, borderRadius: '18px', background: 'rgba(11,17,29,0.9)', border: '1px solid rgba(148,163,184,0.1)' }}>
                      <Typography sx={{ color: '#f4d98a', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.75rem', mb: 2 }}>Editar cena</Typography>

                      <Box sx={{ display: 'grid', gap: 2 }}>
                        <Box component="label" sx={{ display: 'grid', gap: 0.75 }}>
                          <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>Título</Typography>
                          <Box component="input" name="titulo" value={formValues.titulo} onChange={handleChange} sx={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--text-primary)', px: 1.5, py: 1.25, fontSize: '1rem' }} />
                        </Box>

                        <Box component="label" sx={{ display: 'grid', gap: 0.75 }}>
                          <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>Resumo</Typography>
                          <Box component="textarea" name="resumo" value={formValues.resumo} onChange={handleChange} rows={3} sx={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--text-primary)', px: 1.5, py: 1.25, fontSize: '1rem', resize: 'vertical' }} />
                        </Box>

                        <Box component="label" sx={{ display: 'grid', gap: 0.75 }}>
                          <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>Objetivo</Typography>
                          <Box component="textarea" name="objetivo" value={formValues.objetivo} onChange={handleChange} rows={3} sx={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--text-primary)', px: 1.5, py: 1.25, fontSize: '1rem', resize: 'vertical' }} />
                        </Box>

                        <Box component="label" sx={{ display: 'grid', gap: 0.75 }}>
                          <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>Narrativa</Typography>
                          <Box component="textarea" name="descricaoNarracao" value={formValues.descricaoNarracao} onChange={handleChange} rows={5} sx={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: 'var(--text-primary)', px: 1.5, py: 1.25, fontSize: '1rem', resize: 'vertical' }} />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mt: 0.5, alignItems: 'center' }}>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                            sx={{
                              background: 'linear-gradient(135deg, #d4af37, #f0d081)',
                              color: '#050816',
                              fontWeight: 800,
                              textTransform: 'none',
                              borderRadius: '12px',
                            }}
                          >
                            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                          </Button>
                          <Button type="button" onClick={onClose} sx={{ color: 'var(--text-secondary)', textTransform: 'none' }}>
                            Fechar
                          </Button>
                        </Box>

                        {submitError && (
                          <Typography sx={{ color: '#fca5a5', fontSize: '0.92rem', mt: 1 }}>
                            {submitError}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Fade>
    </Modal>
  );
};

CenaDetailPanel.propTypes = {
  cena: PropTypes.shape({
    id: PropTypes.string,
    titulo: PropTypes.string,
    resumo: PropTypes.string,
    objetivo: PropTypes.string,
    descricaoNarracao: PropTypes.string,
    improvisacaoNotas: PropTypes.string,
    estado: PropTypes.string,
    linkImagem: PropTypes.string,
    campanhaId: PropTypes.string,
    universoId: PropTypes.string,
    mestreId: PropTypes.string,
    numeroCena: PropTypes.number,
    numero: PropTypes.number,
    pontosImportantes: PropTypes.arrayOf(PropTypes.string),
    npcsParticipantes: PropTypes.arrayOf(PropTypes.string),
    criaturasEnvolvidas: PropTypes.arrayOf(PropTypes.string),
    consequencias: PropTypes.array,
  }),
  podeEscrever: PropTypes.bool.isRequired,
  ehCenaAtual: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMarcarCenaAtual: PropTypes.func,
};

export default CenaDetailPanel;
