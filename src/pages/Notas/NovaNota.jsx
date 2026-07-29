import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { addRmNota, updateRmNota } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import FormPageHeader from 'components/FormPageHeader/FormPageHeader';
import NotaForm from './NotaForm';
import { NOTA_INITIAL_VALUES } from './notaUtils';

const NovaNota = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canWrite, loadingPermissions } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const notaParaEditar = location.state?.nota ?? null;
  const isEditing = Boolean(notaParaEditar);

  const podeEscrever =
    !loadingCampanhas && campanhaAtiva && canWrite(campanhaAtiva.universoId);

  useEffect(() => {
    if (loadingPermissions || loadingCampanhas) return;
    if (!campanhaAtiva || !podeEscrever) navigate(ROUTE_PATHS.NOTAS);
  }, [loadingPermissions, loadingCampanhas, campanhaAtiva, podeEscrever, navigate]);

  const editInitialValues = notaParaEditar
    ? { ...NOTA_INITIAL_VALUES, ...notaParaEditar }
    : NOTA_INITIAL_VALUES;

  const handleSubmit = async (values, { setSubmitting }) => {
    if (isEditing) {
      await updateRmNota(notaParaEditar.id, values);
    } else {
      await addRmNota({
        ...values,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
      });
    }
    setSubmitting(false);
    navigate(ROUTE_PATHS.NOTAS);
  };

  if (loadingCampanhas || loadingPermissions || !campanhaAtiva || !podeEscrever) {
    return null;
  }

  return (
    <Box className="page-container">
      <FormPageHeader
        titulo={isEditing ? 'Editar Nota' : 'Nova Nota'}
        subtitulo={
          isEditing
            ? `Editando "${notaParaEditar.titulo}" em ${campanhaAtiva.nome}`
            : `Nova nota em ${campanhaAtiva.nome}`
        }
        onVoltar={() => navigate(ROUTE_PATHS.NOTAS)}
      />

      <NotaForm
        initialValues={editInitialValues}
        campanhaId={campanhaAtiva.id}
        onSubmit={handleSubmit}
        onCancelar={() => navigate(ROUTE_PATHS.NOTAS)}
        labelSalvar={isEditing ? 'Salvar Alterações' : 'Salvar Nota'}
        idPrefix="nova-nota"
      />
    </Box>
  );
};

export default NovaNota;
