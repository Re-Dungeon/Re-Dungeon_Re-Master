/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import StarIcon from '@mui/icons-material/Star';
import StarOutlineIcon from '@mui/icons-material/StarBorder';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { ROUTE_PATHS } from 'common/constants/routes';
import { getRmCenas, removeRmCena, updateRmCampanha } from 'service/storage';

const ESTADO_DE_TEXTO = {
  nao_iniciado: 'Não iniciada',
  em_andamento: 'Em andamento',
  concluido: 'Concluída',
  ignorado: 'Ignorada',
  cancelado: 'Cancelada',
};

const getNumeroCena = cena => {
  const numero = Number.isInteger(cena?.numeroCena)
    ? cena.numeroCena
    : Number.isInteger(cena?.numero)
      ? cena.numero
      : 1;
  return `CENA ${String(numero).padStart(2, '0')}`;
};

const CenaDetalhes = () => {
  const navigate = useNavigate();
  const { cenaId } = useParams();
  const { currentUser, isAdmin } = useAuth();
  const { campanhaAtiva, recarregarCampanhas } = useCampanha();
  const [cena, setCena] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modoNarracao, setModoNarracao] = useState(false);
  useEffect(() => {
    if (!campanhaAtiva || !cenaId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getRmCenas(campanhaAtiva.id, campanhaAtiva.universoId, campanhaAtiva.mestreId)
      .then(cenas => {
        const encontrada = cenas.find(item => item.id === cenaId) ?? null;
        setCena(encontrada);
      })
      .catch(() => setCena(null))
      .finally(() => setLoading(false));
  }, [campanhaAtiva, cenaId]);

  const podeEscrever = Boolean(
    campanhaAtiva && (isAdmin || campanhaAtiva.mestreId === currentUser?.uid),
  );
  const ehCenaAtual = Boolean(
    campanhaAtiva && cena && campanhaAtiva.cenaAtualId === cena.id,
  );

  const statusLabel = useMemo(
    () => ESTADO_DE_TEXTO[cena?.estado] || 'Em andamento',
    [cena?.estado],
  );

  const handleVoltar = () => {
    navigate(ROUTE_PATHS.CENAS, { state: { selecionarCenaId: cenaId } });
  };

  const handleEditar = () => {
    navigate(ROUTE_PATHS.NOVA_CENA, { state: { cena } });
  };

  const handleRemover = async () => {
    if (!cena || !podeEscrever) return;
    await removeRmCena(cena.id);
    navigate(ROUTE_PATHS.CENAS);
  };

  const handleMarcarCenaAtual = async () => {
    if (!campanhaAtiva || !cena || !podeEscrever) return;
    await updateRmCampanha(campanhaAtiva.id, { cenaAtualId: cena.id });
    await recarregarCampanhas();
  };

  if (!campanhaAtiva && !loading) return null;
  if (loading) {
    return (
      <Box className="page-container" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Typography sx={{ color: 'var(--text-primary)' }}>Carregando cena...</Typography>
      </Box>
    );
  }

  if (!cena) {
    return (
      <Box className="page-container" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: 'var(--text-primary)', mb: 1, fontSize: '1.5rem', fontWeight: 700 }}>
            Cena não encontrada
          </Typography>
          <Button onClick={handleVoltar} sx={{ color: 'var(--text-primary)' }}>
            Voltar para o Fluxograma
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="page-container" sx={{ minHeight: '100vh', py: 2, px: { xs: 1.5, md: 2 } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '280px minmax(0, 1fr) 280px' }, gap: 2.5, alignItems: 'start' }}>
        <Paper elevation={0} sx={{ background: 'rgba(8,12,20,0.82)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', p: 2, position: 'sticky', top: 16 }}>
          <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', mb: 2 }}>
            Fluxo de Cenas
          </Typography>
          <Typography sx={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.4rem', mb: 1 }}>
            Editar cena
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button onClick={handleVoltar} sx={{ justifyContent: 'flex-start', color: 'var(--text-primary)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', px: 1.5, py: 0.9, textTransform: 'none' }}>
              ← Voltar para o Fluxograma
            </Button>
            <Box sx={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', p: 1.25 }}>
              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {getNumeroCena(cena)}
              </Typography>
              <Typography sx={{ color: 'var(--text-primary)', mt: 0.75, fontWeight: 700 }}>
                {cena.titulo || 'Cena sem título'}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Paper elevation={0} sx={{ background: 'rgba(9,13,21,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 22px 60px rgba(0,0,0,0.28)' }}>
            <Box sx={{ position: 'relative', minHeight: 260, background: cena.linkImagem ? `linear-gradient(180deg, rgba(5,8,17,0.25), rgba(5,8,17,0.72)), url(${cena.linkImagem}) center/cover no-repeat` : 'linear-gradient(135deg, rgba(20,30,42,0.95), rgba(19,12,17,0.95))', p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <Box sx={{ display: 'inline-flex', alignSelf: 'flex-start', px: 1.2, py: 0.6, borderRadius: '999px', background: 'rgba(5,10,16,0.52)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', mb: 1.5 }}>
                {getNumeroCena(cena)}
              </Box>
              <Typography sx={{ color: 'var(--text-primary)', fontSize: { xs: '2rem', md: '2.6rem' }, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08, maxWidth: '80%' }}>
                {cena.titulo || 'Cena sem título'}
              </Typography>
            </Box>

            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                  Cena atual
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button type="button" onClick={() => setModoNarracao(true)} sx={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)', px: 1.4, py: 0.7, borderRadius: '10px', textTransform: 'none' }}>
                    Narrar Cena
                  </Button>
                  <Button type="button" onClick={handleEditar} sx={{ background: 'rgba(196, 58, 47, 0.12)', border: '1px solid rgba(196,58,47,0.2)', color: 'var(--text-primary)', px: 1.4, py: 0.7, borderRadius: '10px', textTransform: 'none' }}>
                    Editar
                  </Button>
                </Box>
              </Box>

              <Paper elevation={0} sx={{ background: 'rgba(8,12,20,0.82)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', p: 2.5 }}>
                <Typography sx={{ color: 'var(--text-primary)', fontSize: '0.76rem', letterSpacing: '0.18em', textTransform: 'uppercase', mb: 1.5 }}>
                  Contexto
                </Typography>
                <Typography sx={{ color: 'var(--text-primary)', lineHeight: 1.8 }}>
                  {cena.resumo || 'Resumo da cena ainda não informado.'}
                </Typography>
              </Paper>

              <Paper elevation={0} sx={{ background: 'rgba(8,12,20,0.82)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', p: 2.5 }}>
                <Typography sx={{ color: 'var(--text-primary)', fontSize: '0.76rem', letterSpacing: '0.18em', textTransform: 'uppercase', mb: 1.5 }}>
                  Objetivo principal
                </Typography>
                <Typography sx={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  {cena.objetivo || 'Nenhum objetivo principal definido ainda.'}
                </Typography>
              </Paper>

              <Paper elevation={0} sx={{ background: 'rgba(8,12,20,0.82)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', p: 2.5 }}>
                <Typography sx={{ color: 'var(--text-primary)', fontSize: '0.76rem', letterSpacing: '0.18em', textTransform: 'uppercase', mb: 1.5 }}>
                  Narração
                </Typography>
                <Typography sx={{ color: 'var(--text-secondary)', lineHeight: 1.9 }}>
                  {modoNarracao ? (cena.descricaoNarracao || 'A cena ainda não possui texto de narração.') : (cena.descricaoNarracao || 'A cena ainda não possui texto de narração.')}
                </Typography>
              </Paper>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Paper elevation={0} sx={{ background: 'rgba(8,12,20,0.82)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', p: 2, position: 'sticky', top: 16 }}>
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', mb: 2 }}>
              Informações da cena
            </Typography>

            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Box sx={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', p: 1.4 }}>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Estado</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, mt: 0.6 }}>{statusLabel}</Typography>
              </Box>

              <Box sx={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', p: 1.4 }}>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>NPCs</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, mt: 0.6 }}>{Array.isArray(cena.npcsParticipantes) ? cena.npcsParticipantes.length : 0} vinculados</Typography>
              </Box>

              <Box sx={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', p: 1.4 }}>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Criaturas</Typography>
                <Typography sx={{ color: 'var(--text-primary)', fontWeight: 700, mt: 0.6 }}>{Array.isArray(cena.criaturasEnvolvidas) ? cena.criaturasEnvolvidas.length : 0} envolvidas</Typography>
              </Box>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ background: 'rgba(8,12,20,0.82)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', p: 2 }}>
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', mb: 1.5 }}>
              Ações
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {podeEscrever && !ehCenaAtual && (
                <Button size="small" startIcon={<StarOutlineIcon fontSize="small" />} onClick={handleMarcarCenaAtual} sx={{ justifyContent: 'flex-start', color: '#f4d98a', border: '1px solid rgba(244,217,138,0.35)', borderRadius: '12px', textTransform: 'none' }}>
                  Marcar como Cena Atual
                </Button>
              )}
              {podeEscrever && ehCenaAtual && (
                <Chip icon={<StarIcon sx={{ color: '#050816 !important' }} fontSize="small" />} label="Cena Atual" sx={{ background: 'linear-gradient(135deg, #d4af37, #f7d77b)', color: '#050816', fontWeight: 800, height: '36px', justifyContent: 'center' }} />
              )}
              {podeEscrever && (
                <Button size="small" startIcon={<DeleteOutlineIcon fontSize="small" />} onClick={handleRemover} sx={{ justifyContent: 'flex-start', color: '#fca5a5', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '12px', textTransform: 'none' }}>
                  Remover Cena
                </Button>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default CenaDetalhes;
