import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { addRmCardfluxBaralho, updateRmCardfluxBaralho } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import FormPageHeader from 'components/FormPageHeader/FormPageHeader';
import BaralhoForm from './BaralhoForm';
import { BARALHO_INITIAL_VALUES } from './baralhoUtils';

const NovoBaralho = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canWrite, loadingPermissions } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const baralhoParaEditar = location.state?.baralho ?? null;
  const isEditing = Boolean(baralhoParaEditar);

  const podeEscrever =
    !loadingCampanhas && campanhaAtiva && canWrite(campanhaAtiva.universoId);

  useEffect(() => {
    if (loadingPermissions || loadingCampanhas) return;
    if (!campanhaAtiva || !podeEscrever) navigate(ROUTE_PATHS.CARDFLUX);
  }, [loadingPermissions, loadingCampanhas, campanhaAtiva, podeEscrever, navigate]);

  const editInitialValues = baralhoParaEditar
    ? { ...BARALHO_INITIAL_VALUES, ...baralhoParaEditar }
    : BARALHO_INITIAL_VALUES;

  const handleSubmit = async (values, { setSubmitting }) => {
    if (isEditing) {
      await updateRmCardfluxBaralho(baralhoParaEditar.id, values);
    } else {
      await addRmCardfluxBaralho({
        ...values,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
      });
    }
    setSubmitting(false);
    navigate(ROUTE_PATHS.CARDFLUX);
  };

  if (loadingCampanhas || loadingPermissions || !campanhaAtiva || !podeEscrever) {
    return null;
  }

  return (
    <Box className="page-container">
      <FormPageHeader
        titulo={isEditing ? 'Editar Baralho' : 'Novo Baralho'}
        subtitulo={
          isEditing
            ? `Editando "${baralhoParaEditar.nome}" em ${campanhaAtiva.nome}`
            : `Novo baralho em ${campanhaAtiva.nome}`
        }
        onVoltar={() => navigate(ROUTE_PATHS.CARDFLUX)}
      />

      <BaralhoForm
        initialValues={editInitialValues}
        onSubmit={handleSubmit}
        onCancelar={() => navigate(ROUTE_PATHS.CARDFLUX)}
        labelSalvar={isEditing ? 'Salvar Alterações' : 'Salvar Baralho'}
      />
    </Box>
  );
};

export default NovoBaralho;
