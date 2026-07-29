import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { addRmCardfluxCarta, updateRmCardfluxCarta } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import FormPageHeader from 'components/FormPageHeader/FormPageHeader';
import CartaForm from './CartaForm';
import { CARTA_INITIAL_VALUES } from './cartaUtils';

const NovaCarta = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canWrite, loadingPermissions } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const baralho = location.state?.baralho ?? null;
  const cartaParaEditar = location.state?.carta ?? null;
  const isEditing = Boolean(cartaParaEditar);

  const podeEscrever =
    !loadingCampanhas && campanhaAtiva && canWrite(campanhaAtiva.universoId);

  useEffect(() => {
    if (loadingPermissions || loadingCampanhas) return;
    if (!campanhaAtiva || !baralho || !podeEscrever) navigate(ROUTE_PATHS.CARDFLUX);
  }, [loadingPermissions, loadingCampanhas, campanhaAtiva, baralho, podeEscrever, navigate]);

  const editInitialValues = cartaParaEditar
    ? { ...CARTA_INITIAL_VALUES, ...cartaParaEditar }
    : CARTA_INITIAL_VALUES;

  const handleSubmit = async (values, { setSubmitting }) => {
    if (isEditing) {
      await updateRmCardfluxCarta(cartaParaEditar.id, values);
    } else {
      await addRmCardfluxCarta({
        ...values,
        baralhoId: baralho.id,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
      });
    }
    setSubmitting(false);
    navigate(ROUTE_PATHS.CARDFLUX_CARTAS, { state: { baralho } });
  };

  if (loadingCampanhas || loadingPermissions || !campanhaAtiva || !baralho || !podeEscrever) {
    return null;
  }

  return (
    <Box className="page-container">
      <FormPageHeader
        titulo={isEditing ? 'Editar Carta' : 'Nova Carta'}
        subtitulo={
          isEditing
            ? `Editando "${cartaParaEditar.titulo}" em ${baralho.nome}`
            : `Nova carta em ${baralho.nome}`
        }
        onVoltar={() => navigate(ROUTE_PATHS.CARDFLUX_CARTAS, { state: { baralho } })}
      />

      <CartaForm
        initialValues={editInitialValues}
        onSubmit={handleSubmit}
        onCancelar={() => navigate(ROUTE_PATHS.CARDFLUX_CARTAS, { state: { baralho } })}
        labelSalvar={isEditing ? 'Salvar Alterações' : 'Salvar Carta'}
        idPrefix="nova-carta"
      />
    </Box>
  );
};

export default NovaCarta;
