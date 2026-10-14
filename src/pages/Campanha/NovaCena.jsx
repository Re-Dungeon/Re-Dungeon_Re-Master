import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { addRmCena, updateRmCena } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import CenaForm from './CenaForm';
import { CENA_INITIAL_VALUES } from './cenaUtils';

const NovaCena = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAdmin, loadingPermissions } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const cenaParaEditar = location.state?.cena ?? null;
  const isEditing = Boolean(cenaParaEditar);

  const podeEscrever =
    !loadingCampanhas &&
    campanhaAtiva &&
    (isAdmin || campanhaAtiva.mestreId === currentUser.uid);

  useEffect(() => {
    if (loadingPermissions || loadingCampanhas) return;
    if (!campanhaAtiva || !podeEscrever) navigate(ROUTE_PATHS.CENAS);
  }, [
    loadingPermissions,
    loadingCampanhas,
    campanhaAtiva,
    podeEscrever,
    navigate,
  ]);

  const editInitialValues = cenaParaEditar
    ? { ...CENA_INITIAL_VALUES, ...cenaParaEditar }
    : CENA_INITIAL_VALUES;

  const handleSubmit = async (values, { setSubmitting }) => {
    if (isEditing) {
      await updateRmCena(cenaParaEditar.id, values);
    } else {
      await addRmCena({
        ...values,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
      });
    }
    setSubmitting(false);
    navigate(ROUTE_PATHS.CENAS);
  };

  if (
    loadingCampanhas ||
    loadingPermissions ||
    !campanhaAtiva ||
    !podeEscrever
  ) {
    return null;
  }

  return (
    <Box className="page-container">
      <Box sx={{ px: { xs: 1.5, md: 2.5 }, pt: 2, pb: 1 }}>
        <Typography
          sx={{
            color: 'var(--text-primary)',
            fontSize: '2rem',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            mb: 0.5,
          }}
        >
          {isEditing ? 'Editar Cena' : 'Nova Cena'}
        </Typography>
        <Typography
          sx={{
            color: 'var(--text-secondary)',
            fontSize: '0.96rem',
            lineHeight: 1.5,
            fontWeight: 500,
            letterSpacing: '0.01em',
          }}
        >
          {isEditing
            ? `Cena em edição: “${cenaParaEditar.titulo || 'Cena'}” • ${campanhaAtiva.nome}`
            : `Nova cena em ${campanhaAtiva.nome}`}
        </Typography>
      </Box>

      <CenaForm
        initialValues={editInitialValues}
        onSubmit={handleSubmit}
        onCancelar={() => navigate(ROUTE_PATHS.CENAS)}
        labelSalvar={isEditing ? 'Salvar Alterações' : 'Salvar Cena'}
        idPrefix="nova-cena"
        campanhaId={campanhaAtiva.id}
        universoId={campanhaAtiva.universoId}
        mestreId={campanhaAtiva.mestreId}
      />
    </Box>
  );
};

export default NovaCena;
