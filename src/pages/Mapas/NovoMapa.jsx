import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { addRmMapa, updateRmMapa } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import MapaFormDialog from './MapaFormDialog';
import { MAPA_INITIAL_VALUES } from './mapaUtils';

const NovoMapa = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAdmin, loadingPermissions } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const mapaParaEditar = location.state?.mapa ?? null;
  const isEditing = Boolean(mapaParaEditar);

  const podeEscrever =
    !loadingCampanhas &&
    campanhaAtiva &&
    (isAdmin || campanhaAtiva.mestreId === currentUser.uid);

  useEffect(() => {
    if (loadingPermissions || loadingCampanhas) return;
    if (!campanhaAtiva || !podeEscrever) navigate(ROUTE_PATHS.MAPAS);
  }, [
    loadingPermissions,
    loadingCampanhas,
    campanhaAtiva,
    podeEscrever,
    navigate,
  ]);

  const editInitialValues = mapaParaEditar
    ? { ...MAPA_INITIAL_VALUES, ...mapaParaEditar }
    : {
        ...MAPA_INITIAL_VALUES,
        tags: [...MAPA_INITIAL_VALUES.tags],
        favorito: false,
      };

  const handleSubmit = async (values, { setSubmitting }) => {
    if (isEditing) {
      await updateRmMapa(mapaParaEditar.id, values);
    } else {
      await addRmMapa({
        ...values,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
      });
    }
    setSubmitting(false);
    navigate(ROUTE_PATHS.MAPAS);
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
      <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1.5 }}>
        {isEditing ? `Editar mapa em ${campanhaAtiva.nome}` : `Novo mapa em ${campanhaAtiva.nome}`}
      </Typography>
      <MapaFormDialog
        open
        mode={isEditing ? 'edit' : 'create'}
        initialValues={editInitialValues}
        onClose={() => navigate(ROUTE_PATHS.MAPAS)}
        onSubmit={handleSubmit}
        submitLabel={isEditing ? 'Salvar Alterações' : 'Salvar Mapa'}
        title={isEditing ? 'Editar Mapa' : 'Novo Mapa'}
      />
    </Box>
  );
};

export default NovoMapa;
