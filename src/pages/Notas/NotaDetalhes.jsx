/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Notas.css';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { ROUTE_PATHS } from 'common/constants/routes';
import { getRmCenas, getRmNotasPorCampanha } from 'service/storage';
import { getNotaCapa, renderNotaContentHtml } from './notaUtils';

const formatarData = valor => {
  if (!valor) return null;
  const timestamp =
    valor instanceof Date
      ? valor.getTime()
      : typeof valor?.toDate === 'function'
        ? valor.toDate().getTime()
        : typeof valor?.toMillis === 'function'
          ? valor.toMillis()
          : typeof valor === 'string'
            ? new Date(valor).getTime()
            : Number(valor);

  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(timestamp));
};

const normalizeTags = tags => {
  if (Array.isArray(tags)) return tags.filter(Boolean).map(tag => String(tag).trim()).filter(Boolean);
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }
  return [];
};

const NotaDetalhes = () => {
  const navigate = useNavigate();
  const { notaId } = useParams();
  const { currentUser, isAdmin } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const [nota, setNota] = useState(null);
  const [cenas, setCenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!campanhaAtiva || !notaId) {
      return;
    }

    setLoading(true);
    setError(false);

    Promise.all([
      getRmNotasPorCampanha(campanhaAtiva.id, campanhaAtiva.universoId, campanhaAtiva.mestreId),
      getRmCenas(campanhaAtiva.id, campanhaAtiva.universoId, campanhaAtiva.mestreId),
    ])
      .then(([notasCampanha, cenasCampanha]) => {
        const encontrada = notasCampanha.find(item => item.id === notaId) ?? null;
        setNota(encontrada);
        setCenas(cenasCampanha || []);
      })
      .catch(() => {
        setNota(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [campanhaAtiva, notaId]);

  const cenaRelacionada = nota ? cenas.find(item => item.id === nota.cenaId) ?? null : null;

  const podeEscrever = Boolean(
    campanhaAtiva && (isAdmin || campanhaAtiva.mestreId === currentUser?.uid),
  );

  const tags = useMemo(() => normalizeTags(nota?.tags), [nota?.tags]);
  const imagemCapa = getNotaCapa(nota) || getNotaCapa(cenaRelacionada);
  const dataAtualizacao = formatarData(nota?.updatedAt ?? nota?.createdAt);

  const handleVoltar = () => navigate(ROUTE_PATHS.NOTAS);
  const handleEditar = () =>
    navigate(ROUTE_PATHS.NOTA_EDITAR.replace(':notaId', nota.id), {
      state: { nota },
    });

  if (!campanhaAtiva && !loadingCampanhas) {
    return (
      <Box className="page-container" sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <Box sx={{ textAlign: 'center', maxWidth: 480 }}>
          <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 800, mb: 1 }}>
            Não foi possível carregar a entidade.
          </Typography>
          <Button onClick={handleVoltar} sx={{ color: 'var(--text-primary)' }}>
            Voltar para Universo
          </Button>
        </Box>
      </Box>
    );
  }

  if (loading || loadingCampanhas) {
    return (
      <Box className="page-container" sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--text-primary)' }}>
          <CircularProgress size={20} sx={{ color: 'var(--color-accent)' }} />
          <Typography>Carregando entidade...</Typography>
        </Box>
      </Box>
    );
  }

  if (error || !nota) {
    return (
      <Box className="page-container" sx={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
          <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 800, mb: 1 }}>
            Entidade não disponível
          </Typography>
          <Typography sx={{ color: 'var(--text-secondary)', mb: 2 }}>
            A entidade solicitada não foi encontrada ou não pôde ser carregada.
          </Typography>
          <Button
            variant="contained"
            onClick={handleVoltar}
            sx={{ background: 'linear-gradient(135deg, #7f3db8 0%, #4f1d7c 100%)' }}
          >
            Voltar para Universo
          </Button>
        </Box>
      </Box>
    );
  }

  const resumo = (nota.resumo || '').trim();

  return (
    <Box className="page-container nota-detalhes-page">
      <Box className="nota-detalhes-shell">
        <Box
          className="nota-detalhes-cover"
          sx={imagemCapa ? { backgroundImage: `linear-gradient(180deg, rgba(5,8,15,0.22), rgba(5,8,15,0.72)), url(${imagemCapa})` } : undefined}
        >
          <Box className="nota-detalhes-cover__overlay">
            <Box className="nota-detalhes-cover__actions">
              <Button
                type="button"
                startIcon={<ArrowBackOutlinedIcon />}
                onClick={handleVoltar}
                className="nota-detalhes-action nota-detalhes-action--muted"
              >
                Voltar para Universo
              </Button>

              {podeEscrever && (
                <Button
                  type="button"
                  startIcon={<EditOutlinedIcon />}
                  onClick={handleEditar}
                  className="nota-detalhes-action nota-detalhes-action--primary"
                >
                  Editar entidade
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        <Box className="nota-detalhes-identity">
          <Box className="nota-detalhes-avatar-wrap">
            {imagemCapa ? (
              <Box
                component="img"
                src={imagemCapa}
                alt={nota.titulo || 'Imagem da entidade'}
                className="nota-detalhes-avatar"
              />
            ) : (
              <Box className="nota-detalhes-avatar nota-detalhes-avatar--fallback">
                ✦
              </Box>
            )}
          </Box>

          <Box className="nota-detalhes-identity__content">
            <Typography component="span" className="nota-detalhes-category">
              {nota.tipo || 'Entidade'}
            </Typography>
            <Typography component="h1" className="nota-detalhes-title">
              {nota.titulo || 'Entidade sem título'}
            </Typography>
            {resumo && (
              <Typography className="nota-detalhes-summary">
                {resumo}
              </Typography>
            )}
          </Box>
        </Box>

        <Box className="nota-detalhes-layout">
          <Box className="nota-detalhes-main">
            <Paper elevation={0} className="nota-detalhes-panel">
              <Typography className="nota-detalhes-section-title">
                Conteúdo
              </Typography>
              <Box
                className="nota-detalhes-content"
                dangerouslySetInnerHTML={{
                  __html: renderNotaContentHtml(nota.conteudo),
                }}
              />
            </Paper>
          </Box>

          <Box className="nota-detalhes-sidebar">
            <Paper elevation={0} className="nota-detalhes-panel nota-detalhes-panel--compact">
              <Typography className="nota-detalhes-section-title">
                Informações
              </Typography>

              <Box className="nota-detalhes-info-list">
                {nota.tipo && (
                  <Box className="nota-detalhes-info-item">
                    <Typography className="nota-detalhes-info-label">Categoria</Typography>
                    <Typography className="nota-detalhes-info-value">{nota.tipo}</Typography>
                  </Box>
                )}

                {cenaRelacionada && (
                  <Box className="nota-detalhes-info-item">
                    <Typography className="nota-detalhes-info-label">Vinculada a</Typography>
                    <Typography className="nota-detalhes-info-value">
                      {cenaRelacionada.titulo || 'Cena'}
                    </Typography>
                  </Box>
                )}

                {dataAtualizacao && (
                  <Box className="nota-detalhes-info-item">
                    <Typography className="nota-detalhes-info-label">Atualização</Typography>
                    <Typography className="nota-detalhes-info-value">{dataAtualizacao}</Typography>
                  </Box>
                )}
              </Box>
            </Paper>

            {tags.length > 0 && (
              <Paper elevation={0} className="nota-detalhes-panel nota-detalhes-panel--compact">
                <Typography className="nota-detalhes-section-title">
                  Tags
                </Typography>
                <Box className="nota-detalhes-tags">
                  {tags.map(tag => (
                    <Chip key={`${nota.id}-${tag}`} label={tag} className="nota-detalhes-tag" />
                  ))}
                </Box>
              </Paper>
            )}

            {cenaRelacionada && (
              <Paper elevation={0} className="nota-detalhes-panel nota-detalhes-panel--compact">
                <Typography className="nota-detalhes-section-title">
                  Conexões
                </Typography>
                <Button
                  type="button"
                  className="nota-detalhes-connection"
                  onClick={() => navigate(ROUTE_PATHS.CENAS, { state: { selecionarCenaId: cenaRelacionada.id } })}
                >
                  <Box className="nota-detalhes-connection__thumb">
                    {cenaRelacionada.titulo?.slice(0, 1)?.toUpperCase() || 'C'}
                  </Box>
                  <Box className="nota-detalhes-connection__info">
                    <Typography className="nota-detalhes-connection__name">
                      {cenaRelacionada.titulo || 'Cena'}
                    </Typography>
                    <Typography className="nota-detalhes-connection__meta">Cena vinculada</Typography>
                  </Box>
                </Button>
              </Paper>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default NotaDetalhes;
