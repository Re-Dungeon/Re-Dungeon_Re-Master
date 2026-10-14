import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useCampanha } from 'context/CampanhaContext';
import {
  addRmCardfluxExploracao,
  getCardfluxCartas,
  getRmMapasPastasPorCampanha,
  getRmMapasPorCampanha,
} from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import useAsyncEffect from 'hooks/useAsyncEffect';
import {
  gerarExploracaoGrid,
  sanitizarExploracaoParaPersistencia,
  validarConfiguracaoExploracao,
} from './exploracaoGrid';
import CardFluxMapaSelectorModal from './CardFluxMapaSelectorModal';

const cardSx = {
  p: { xs: 2, md: 3 },
  background:
    'linear-gradient(180deg, rgba(20, 24, 30, 0.98), rgba(12, 15, 20, 0.98))',
  border: '1px solid var(--border-primary)',
  borderRadius: 3,
  boxShadow: '0 24px 52px rgba(0,0,0,0.18)',
};

const primaryButtonSx = {
  minHeight: '46px',
  px: { xs: 2, md: 2.5 },
  py: 1.25,
  borderRadius: 2,
  background: 'linear-gradient(135deg, var(--color-accent), #ab2b27)',
  color: 'var(--text-primary)',
  fontWeight: 700,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
};

const secondaryButtonSx = {
  minHeight: '44px',
  borderRadius: 2,
  px: 1.5,
  py: 1,
  color: 'var(--text-primary)',
  border: '1px solid rgba(196, 58, 47, 0.35)',
  background: 'rgba(196, 58, 47, 0.06)',
  fontWeight: 700,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    background: 'rgba(8, 11, 17, 0.72)',
    borderRadius: 2,
    color: 'var(--text-primary)',
    '& fieldset': { borderColor: 'var(--border-primary)' },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--color-accent)',
      boxShadow: '0 0 0 3px rgba(196,58,47,0.12)',
    },
  },
  '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
  '& .MuiInputBase-input': { color: 'var(--text-primary)' },
};

const CardFluxExploracaoConfig = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const [cartas, setCartas] = useState([]);
  const [mapasDisponiveis, setMapasDisponiveis] = useState([]);
  const [pastasDisponiveis, setPastasDisponiveis] = useState([]);
  const [loadingCartas, setLoadingCartas] = useState(true);
  const [loadingMapas, setLoadingMapas] = useState(true);
  const [loadingPastas, setLoadingPastas] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [ajudaAberta, setAjudaAberta] = useState(false);
  const [imagemFundoModalAberta, setImagemFundoModalAberta] = useState(false);
  const [imagemFundoDraft, setImagemFundoDraft] = useState({
    origem: 'mapa',
    mapaId: null,
    url: '',
    ajuste: 'cover',
    opacidadeQuadrantes: 20,
  });
  const defaultBaralhos = Array.isArray(location.state?.baralhos)
    ? location.state.baralhos
    : [];

  const [form, setForm] = useState({
    nome: 'Exploração de Campo',
    baralhos: defaultBaralhos,
    linhas: 3,
    colunas: 3,
    densidade: 35,
    modo: 'predefinida',
    repetir: false,
    respeitarCooldown: false,
    imagemFundo: {
      origem: 'mapa',
      mapaId: null,
      url: '',
      ajuste: 'cover',
      opacidadeQuadrantes: 20,
    },
  });

  useAsyncEffect(() => {
    const imagemMapaState = location.state?.imagemFundo;
    if (!imagemMapaState) return;

    setForm(prev => ({
      ...prev,
      imagemFundo: {
        origem: imagemMapaState.origem === 'mapa' ? 'mapa' : 'url',
        mapaId: imagemMapaState.mapaId || null,
        url: typeof imagemMapaState.url === 'string' ? imagemMapaState.url : '',
        ajuste: ['cover', 'contain', 'fill'].includes(imagemMapaState.ajuste)
          ? imagemMapaState.ajuste
          : 'cover',
        opacidadeQuadrantes: Number.isFinite(Number(imagemMapaState.opacidadeQuadrantes))
          ? Number(imagemMapaState.opacidadeQuadrantes)
          : 20,
      },
    }));
  }, [location.state]);

  useAsyncEffect(() => {
    if (!campanhaAtiva) {
      setCartas([]);
      setMapasDisponiveis([]);
      setLoadingCartas(false);
      setLoadingMapas(false);
      return;
    }

    const carregarCartas = async () => {
      setLoadingCartas(true);
      try {
        const cartasDoUniverso = await getCardfluxCartas(campanhaAtiva.universoId);
        setCartas(cartasDoUniverso || []);
        const decks = [...new Set((cartasDoUniverso || []).map(carta => carta.deck).filter(Boolean))];
        setForm(prev => ({
          ...prev,
          baralhos:
            prev.baralhos.length > 0
              ? prev.baralhos
              : decks.slice(0, 1),
        }));
      } catch {
        setCartas([]);
      } finally {
        setLoadingCartas(false);
      }
    };

    const carregarMapas = async () => {
      setLoadingMapas(true);
      setLoadingPastas(true);
      try {
        const [mapasDoMestre, pastasDoMestre] = await Promise.all([
          getRmMapasPorCampanha(
            campanhaAtiva.id,
            campanhaAtiva.universoId,
            campanhaAtiva.mestreId,
          ),
          getRmMapasPastasPorCampanha(
            campanhaAtiva.id,
            campanhaAtiva.universoId,
            campanhaAtiva.mestreId,
          ),
        ]);
        setMapasDisponiveis(mapasDoMestre || []);
        setPastasDisponiveis(pastasDoMestre || []);
      } catch {
        setMapasDisponiveis([]);
        setPastasDisponiveis([]);
      } finally {
        setLoadingMapas(false);
        setLoadingPastas(false);
      }
    };

    carregarCartas();
    carregarMapas();
  }, [campanhaAtiva]);

  const baralhosDisponiveis = useMemo(
    () => [...new Set(cartas.map(carta => carta.deck).filter(Boolean))],
    [cartas],
  );

  const handleSelecionarMapaFundo = proximo => {
    if (!proximo) return;

    if (proximo.source === 'mode') {
      setImagemFundoDraft(prev => ({ ...prev, origem: proximo.origem }));
      return;
    }

    if (proximo.source === 'url') {
      setImagemFundoDraft(prev => ({ ...prev, url: proximo.value }));
      return;
    }

    if (proximo.source === 'ajuste') {
      setImagemFundoDraft(prev => ({ ...prev, ajuste: proximo.value }));
      return;
    }

    if (proximo.source === 'opacidade') {
      setImagemFundoDraft(prev => ({ ...prev, opacidadeQuadrantes: proximo.value }));
      return;
    }

    setImagemFundoDraft(prev => ({
      ...prev,
      origem: 'mapa',
      mapaId: proximo.id,
      url: proximo.linkImagem || prev.url,
    }));
  };

  const validacao = validarConfiguracaoExploracao({
    ...form,
    linhas: Number(form.linhas),
    colunas: Number(form.colunas),
    densidade: Number(form.densidade),
    modo: form.modo,
  });

  const handleChange = event => {
    const { name, value, type, checked } = event.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const imagemFundoValida = value => {
    if (!value || !value.trim()) return true;
    try {
      const url = new URL(value.trim());
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  };

  const abrirModalImagemFundo = () => {
    const base = form.imagemFundo || {
      origem: 'mapa',
      mapaId: null,
      url: '',
      ajuste: 'cover',
      opacidadeQuadrantes: 20,
    };
    setImagemFundoDraft({
      origem: base.origem === 'mapa' ? 'mapa' : 'url',
      mapaId: base.mapaId || null,
      url: typeof base.url === 'string' ? base.url : '',
      ajuste: ['cover', 'contain', 'fill'].includes(base.ajuste) ? base.ajuste : 'cover',
      opacidadeQuadrantes: Number.isFinite(Number(base.opacidadeQuadrantes))
        ? Number(base.opacidadeQuadrantes)
        : 20,
    });
    setImagemFundoModalAberta(true);
  };

  const salvarImagemFundo = () => {
    const origem = imagemFundoDraft.origem === 'mapa' ? 'mapa' : 'url';
    const mapaSelecionadoAtual = origem === 'mapa'
      ? mapasDisponiveis.find(mapa => mapa.id === imagemFundoDraft.mapaId) || null
      : null;
    const url = origem === 'mapa'
      ? (mapaSelecionadoAtual?.linkImagem || '').trim()
      : (imagemFundoDraft.url || '').trim();

    if (origem === 'mapa' && (!mapaSelecionadoAtual || !mapaSelecionadoAtual.linkImagem)) {
      return;
    }

    if (origem === 'url' && url && !imagemFundoValida(url)) {
      return;
    }

    setForm(prev => ({
      ...prev,
      imagemFundo: {
        origem,
        mapaId: origem === 'mapa' ? imagemFundoDraft.mapaId || null : null,
        url,
        ajuste: ['cover', 'contain', 'fill'].includes(imagemFundoDraft.ajuste)
          ? imagemFundoDraft.ajuste
          : 'cover',
        opacidadeQuadrantes: Number.isFinite(Number(imagemFundoDraft.opacidadeQuadrantes))
          ? Math.min(100, Math.max(0, Number(imagemFundoDraft.opacidadeQuadrantes)))
          : 20,
      },
    }));
    setImagemFundoModalAberta(false);
  };

  const removerImagemFundo = () => {
    setForm(prev => ({
      ...prev,
      imagemFundo: {
        origem: 'mapa',
        mapaId: null,
        url: '',
        ajuste: 'cover',
        opacidadeQuadrantes: 20,
      },
    }));
    setImagemFundoModalAberta(false);
  };

  const handleGerar = async () => {
    if (!campanhaAtiva || !validacao.valida) return;

    const camposObrigatorios = [
      ['campanhaId', campanhaAtiva.id],
      ['mestreId', campanhaAtiva.mestreId],
      ['universoId', campanhaAtiva.universoId],
    ];
    const faltante = camposObrigatorios.find(([, valor]) => !valor);
    if (faltante) {
      setSubmitError(
        `Não foi possível gerar a exploração: campo obrigatório ausente (${faltante[0]}).`,
      );
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const exploracao = gerarExploracaoGrid({
        nome: form.nome,
        mestreId: campanhaAtiva.mestreId,
        universoId: campanhaAtiva.universoId,
        campanhaId: campanhaAtiva.id,
        baralhos: form.baralhos,
        linhas: Number(form.linhas),
        colunas: Number(form.colunas),
        densidade: Number(form.densidade),
        modo: form.modo,
        repetir: Boolean(form.repetir),
        respeitarCooldown: Boolean(form.respeitarCooldown),
        imagemFundo: form.imagemFundo,
        cartas,
        status: 'ativa',
      });

      const payload = sanitizarExploracaoParaPersistencia(exploracao, {
        exigirCamposObrigatorios: true,
      });
      const salvo = await addRmCardfluxExploracao(payload);
      navigate(ROUTE_PATHS.CARDFLUX_EXPLORACAO.replace(':exploracaoId', salvo.id), {
        state: { exploracao: { ...payload, id: salvo.id } },
      });
    } catch (error) {
      setSubmitError(
        error?.message || 'Não foi possível salvar a exploração. Tente novamente.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!campanhaAtiva && !loadingCampanhas) return null;

  return (
    <Box className="page-container" sx={{ display: 'grid', placeItems: 'center', py: 4 }}>
      <Paper elevation={0} sx={{ ...cardSx, width: '100%', maxWidth: 980 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'var(--color-accent)', fontWeight: 800, letterSpacing: '0.12em' }}>
              Configurar exploração
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, color: 'var(--text-primary)', fontWeight: 800 }}>
              Gerar Grid de exploração
            </Typography>
          </Box>

          <IconButton
            aria-label="Ajuda sobre o Grid de Exploração"
            onClick={() => setAjudaAberta(true)}
            sx={{
              width: 42,
              height: 42,
              border: '1px solid rgba(196, 58, 47, 0.35)',
              background: 'rgba(196, 58, 47, 0.08)',
              color: 'var(--color-accent)',
              fontWeight: 900,
              fontSize: '1.1rem',
              '&:hover': {
                background: 'rgba(196, 58, 47, 0.12)',
                borderColor: 'rgba(196, 58, 47, 0.6)',
              },
            }}
          >
            ?
          </IconButton>
        </Box>

        <Typography variant="body2" sx={{ mt: 1, color: 'var(--text-secondary)' }}>
          Campanha: {campanhaAtiva?.nome || '—'} · Universo: {campanhaAtiva?.universoId || '—'}
        </Typography>

        {loadingCartas ? (
          <Typography sx={{ mt: 3, color: 'var(--text-secondary)' }}>
            Carregando baralhos…
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mt: 3 }}>
            <TextField
              fullWidth
              label="Nome da exploração"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              sx={fieldSx}
              error={Boolean(validacao.errors.find(item => item.campo === 'nome'))}
              helperText={
                validacao.errors.find(item => item.campo === 'nome')
                  ? 'Informe um nome.'
                  : ''
              }
            />

            <FormControl fullWidth sx={fieldSx}>
              <InputLabel id="exploracao-baralhos-label">Baralhos</InputLabel>
              <Select
                labelId="exploracao-baralhos-label"
                label="Baralhos"
                multiple
                value={form.baralhos}
                onChange={event =>
                  setForm(prev => ({
                    ...prev,
                    baralhos: event.target.value,
                  }))
                }
                renderValue={selected => (selected || []).join(', ')}
              >
                {baralhosDisponiveis.map(baralho => (
                  <MenuItem key={baralho} value={baralho}>
                    {baralho}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Linhas"
              type="number"
              name="linhas"
              value={form.linhas}
              onChange={handleChange}
              slotProps={{
                htmlInput: {
                  min: 1,
                  max: 12,
                  step: 1,
                },
              }}
              sx={fieldSx}
            />

            <TextField
              fullWidth
              label="Colunas"
              type="number"
              name="colunas"
              value={form.colunas}
              onChange={handleChange}
              slotProps={{
                htmlInput: {
                  min: 1,
                  max: 12,
                  step: 1,
                },
              }}
              sx={fieldSx}
            />

            <TextField
              fullWidth
              label="Densidade (%)"
              type="number"
              name="densidade"
              value={form.densidade}
              onChange={handleChange}
              slotProps={{
                htmlInput: {
                  min: 0,
                  max: 100,
                  step: 1,
                },
              }}
              sx={fieldSx}
            />

            <FormControl fullWidth sx={fieldSx}>
              <InputLabel id="exploracao-modo-label">Distribuição</InputLabel>
              <Select
                labelId="exploracao-modo-label"
                label="Distribuição"
                value={form.modo}
                name="modo"
                onChange={handleChange}
              >
                <MenuItem value="predefinida">Predefinida</MenuItem>
                <MenuItem value="dinamica">Dinâmica</MenuItem>
                <MenuItem value="hibrida">Híbrida</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(form.repetir)}
                  onChange={handleChange}
                  name="repetir"
                  sx={{ color: 'var(--color-accent)' }}
                />
              }
              label="Permitir repetição de cartas"
              sx={{ color: 'var(--text-primary)' }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(form.respeitarCooldown)}
                  onChange={handleChange}
                  name="respeitarCooldown"
                  sx={{ color: 'var(--color-accent)' }}
                />
              }
              label="Respeitar cooldown"
              sx={{ color: 'var(--text-primary)' }}
            />

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Button
                variant="outlined"
                type="button"
                onClick={abrirModalImagemFundo}
                sx={{ ...secondaryButtonSx, width: '100%' }}
              >
                {form.imagemFundo?.url ? 'Alterar imagem de fundo' : 'Adicionar imagem de fundo'}
              </Button>
            </Box>
          </Box>
        )}

        {!validacao.valida && (
          <Box sx={{ mt: 2, px: 1.25, py: 1, borderRadius: 2, background: 'rgba(196,58,47,0.08)', border: '1px solid rgba(196,58,47,0.2)' }}>
            <Typography sx={{ color: 'var(--text-primary)' }}>{validacao.aviso || 'Revise os campos da exploração.'}</Typography>
          </Box>
        )}

        {submitError && (
          <Box sx={{ mt: 2, px: 1.25, py: 1, borderRadius: 2, background: 'rgba(196,58,47,0.08)', border: '1px solid rgba(196,58,47,0.2)' }}>
            <Typography sx={{ color: 'var(--text-primary)' }}>{submitError}</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
          <Button
            variant="text"
            onClick={() => navigate(ROUTE_PATHS.CARDFLUX_EXPLORACOES)}
            sx={{
              ...secondaryButtonSx,
              border: '1px solid rgba(196,58,47,0.18)',
              background: 'rgba(196,58,47,0.04)',
            }}
          >
            Minhas Explorações
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(ROUTE_PATHS.CARDFLUX)}
            sx={secondaryButtonSx}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={!validacao.valida || loadingCartas || form.baralhos.length === 0 || isSubmitting}
            onClick={handleGerar}
            sx={primaryButtonSx}
          >
            {isSubmitting ? 'Salvando...' : 'Gerar Grid'}
          </Button>
        </Box>
      </Paper>

      <CardFluxMapaSelectorModal
        open={imagemFundoModalAberta}
        onClose={() => setImagemFundoModalAberta(false)}
        onSave={salvarImagemFundo}
        onRemoveImage={removerImagemFundo}
        onSelectMap={handleSelecionarMapaFundo}
        draft={imagemFundoDraft}
        mapasDisponiveis={mapasDisponiveis}
        pastasDisponiveis={pastasDisponiveis}
        loadingMapas={loadingMapas}
        loadingPastas={loadingPastas}
      />

      <Dialog
        open={ajudaAberta}
        onClose={() => setAjudaAberta(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              background: 'linear-gradient(180deg, rgba(20,24,30,0.98), rgba(12,15,20,0.98))',
              border: '1px solid rgba(196,58,47,0.28)',
              borderRadius: 3,
              color: 'var(--text-primary)',
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, color: 'var(--text-primary)', fontWeight: 800 }}>
          <span>Guia do Grid de Exploração</span>
          <IconButton
            aria-label="Fechar ajuda"
            onClick={() => setAjudaAberta(false)}
            size="small"
            sx={{
              color: 'var(--text-secondary)',
              '&:hover': { background: 'rgba(196,58,47,0.10)', color: 'var(--text-primary)' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ background: 'rgba(8,11,17,0.4)' }}>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
            Este guia reflete o comportamento real do motor de exploração, sem alterar a geração atual do grid.
          </Typography>

          <Accordion defaultExpanded sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>1. O que entra na geração</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}>
                O grid usa apenas cartas do universo ativo e somente aquelas cujo <strong>deck</strong> está entre os baralhos selecionados.
              </Typography>
              <Typography component="p" sx={{ mb: 1.5 }}>
                Cartas com <strong>peso 0</strong> exclui a carta do sorteio automático e não entram no pool válido. Essa regra existe para evitar geração acidental de eventos impossíveis; a atribuição manual ainda pode ser usada depois, se o mestre quiser forçar um card específico em um quadrante.
              </Typography>
              <Typography component="p" sx={{ mb: 0 }}>
                Se <strong>Permitir repetição de cartas</strong> estiver desligado, cada carta pode aparecer no máximo uma vez na mesma exploração. Quando a lista esgota, o sistema recorre ao pool restante sem quebrar a geração.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>2. Densidade e tamanho</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}>
                A densidade é um percentual do total de quadrantes da matriz. A fórmula calcula quantos espaços receberão ocorrência de conteúdo com base em <strong>linhas × colunas × densidade / 100</strong>.
              </Typography>
              <Typography component="p" sx={{ mb: 1.5 }}>
                Linhas e colunas aceitam valores inteiros entre 1 e 12. O sistema valida o conjunto antes da criação e bloqueia a geração quando algum campo não está consistente.
              </Typography>
              <Typography component="p" sx={{ mb: 0 }}>
                O saldo real depende também de quantas cartas elegíveis existem para os baralhos ativos, do modo de distribuição e do filtro de cooldown.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>3. Modos de distribuição</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}>
                <strong>Predefinida:</strong> o evento já nasce revelado no quadrante. A ficha aparece imediatamente e recebe a descrição “Acontecimento gerado.”
              </Typography>
              <Typography component="p" sx={{ mb: 1.5 }}>
                <strong>Dinâmica:</strong> a carta é criada no grid, mas fica oculta até ser revelada manualmente pelo mestre. A geração continua usando a roleta ponderada pelos pesos das cartas.
              </Typography>
              <Typography component="p" sx={{ mb: 0 }}>
                <strong>Híbrida:</strong> combina a mesma lógica dinâmica com o mesmo sorteio ponderado; o visual do grid mantém a carta oculta até que a ação de revelação aconteça.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>4. Cooldown, peso e repetição</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}>
                Com o <strong>Respeitar cooldown</strong> ativo, cartas com cooldown ainda pendente não entram no sorteio automático. Isso evita gerar eventos repetidos em sequência.
              </Typography>
              <Typography component="p" sx={{ mb: 1.5 }}>
                O peso da carta é usado como valor relativo para roleta cumulativa. Sem peso válido, o sistema assume 1. Em outras palavras: carta mais pesada tem mais chance de ser escolhida, mas zero continua sendo excluída do pool automático.
              </Typography>
              <Typography component="p" sx={{ mb: 0 }}>
                O objetivo da geração não é “preencher tudo”; ele gera somente a quantidade definida pela densidade e depois deixa o mestre ajustar quadrantes e resultados conforme a sessão.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2, mb: 1.5 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>5. Imagem de fundo do grid</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}>
                O grid pode receber uma imagem de fundo contínua por trás de todos os quadrantes. A imagem é salva no documento da exploração e reaproveitada ao abrir a mesma página de jogo.
              </Typography>
              <Typography component="p" sx={{ mb: 1.5 }}>
                <strong>Meus Mapas:</strong> permite selecionar uma imagem já cadastrada na aba Mapas do Re para utilizar como fundo da exploração.
              </Typography>
              <Typography component="p" sx={{ mb: 1.5 }}>
                <strong>Link da Imagem:</strong> permite utilizar uma imagem externa através de sua URL.
              </Typography>
              <Typography component="p" sx={{ mb: 1.5 }}>
                O ajuste define como a imagem ocupa o painel: <strong>Preencher</strong> cobre o espaço sem distorcer a proporção, <strong>Ajustar</strong> mostra a imagem inteira sem cortar bordas e <strong>Esticar</strong> distorce a imagem para cobrir completamente o quadro.
              </Typography>
              <Typography component="p" sx={{ mb: 0 }}>
                A opacidade dos quadrantes controla o nível de transparência da camada visual do fundo, mantendo a leitura dos blocos do grid sem remover o contexto da ilustração de cenário. O fundo é ilustrativo e não altera os acontecimentos do CardFlux.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ background: 'rgba(17,22,30,0.94)', color: 'var(--text-primary)', borderRadius: 2 }}>
            <AccordionSummary sx={{ '& .MuiAccordionSummary-content': { my: 1 } }}>
              <Typography sx={{ fontWeight: 700 }}>6. Fluxo de uso</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ color: 'var(--text-secondary)' }}>
              <Typography component="p" sx={{ mb: 1.5 }}>
                Depois de gerar o grid, você pode revelar quadrantes, associar manualmente uma carta, registrar o resultado e ajustar observações do mestre sem perder o contexto da exploração.
              </Typography>
              <Typography component="p" sx={{ mb: 0 }}>
                O botão de ajuda não salva nem reescreve os dados do formulário; ele apenas abre a documentação do comportamento atual, preservando o estado do formulário enquanto a janela está aberta.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAjudaAberta(false)} sx={{ ...secondaryButtonSx, minWidth: 110 }}>
            Entendi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CardFluxExploracaoConfig;
