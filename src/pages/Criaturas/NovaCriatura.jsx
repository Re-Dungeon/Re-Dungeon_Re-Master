import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { addRmCriatura, updateRmCriatura, getPersonagens } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import FormPageHeader from 'components/FormPageHeader/FormPageHeader';
import CriaturaForm from './CriaturaForm';
import { CRIATURA_INITIAL_VALUES } from './criaturaUtils';

const NovaCriatura = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canWrite, loadingPermissions } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const criaturaParaEditar = location.state?.criatura ?? null;
  const isEditing = Boolean(criaturaParaEditar);

  const [personagens, setPersonagens] = useState([]);

  const podeEscrever =
    !loadingCampanhas && campanhaAtiva && canWrite(campanhaAtiva.universoId);

  useEffect(() => {
    if (loadingPermissions || loadingCampanhas) return;
    if (!campanhaAtiva || !podeEscrever) navigate(ROUTE_PATHS.CRIATURAS);
  }, [loadingPermissions, loadingCampanhas, campanhaAtiva, podeEscrever, navigate]);

  useEffect(() => {
    if (!campanhaAtiva) return;
    Promise.resolve().then(() =>
      getPersonagens().then(todos =>
        setPersonagens(todos.filter(p => p.universo === campanhaAtiva.universoId)),
      ),
    );
  }, [campanhaAtiva]);

  const editInitialValues = criaturaParaEditar
    ? { ...CRIATURA_INITIAL_VALUES, ...criaturaParaEditar }
    : CRIATURA_INITIAL_VALUES;

  const handleSubmit = async (values, { setSubmitting }) => {
    if (isEditing) {
      await updateRmCriatura(criaturaParaEditar.id, values);
    } else {
      await addRmCriatura({
        ...values,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
      });
    }
    setSubmitting(false);
    navigate(ROUTE_PATHS.CRIATURAS);
  };

  if (loadingCampanhas || loadingPermissions || !campanhaAtiva || !podeEscrever) {
    return null;
  }

  return (
    <Box className="page-container">
      <FormPageHeader
        titulo={isEditing ? 'Editar Criatura' : 'Nova Criatura'}
        subtitulo={
          isEditing
            ? `Editando "${criaturaParaEditar.nome}" em ${campanhaAtiva.nome}`
            : `Nova criatura em ${campanhaAtiva.nome}`
        }
        onVoltar={() => navigate(ROUTE_PATHS.CRIATURAS)}
      />

      <CriaturaForm
        initialValues={editInitialValues}
        personagens={personagens}
        onSubmit={handleSubmit}
        onCancelar={() => navigate(ROUTE_PATHS.CRIATURAS)}
        labelSalvar={isEditing ? 'Salvar Alterações' : 'Salvar Criatura'}
        idPrefix="nova-criatura"
      />
    </Box>
  );
};

export default NovaCriatura;
