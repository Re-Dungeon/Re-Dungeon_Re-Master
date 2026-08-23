import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import {
  addRmCampanhaCriatura,
  updateRmCampanhaCriatura,
} from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import FormPageHeader from 'components/FormPageHeader/FormPageHeader';
import CriaturaForm from './CriaturaForm';
import { CRIATURA_INITIAL_VALUES } from './criaturaUtils';

// Mesmo padrão de pages/Npcs/EditarNpcClone.jsx e
// pages/Jogadores/EditarJogadorClone.jsx: preenche/edita os campos
// específicos da campanha para o clone de uma Criatura (subcoleção
// rmCampanhas/{id}/criaturas). Sempre chegada aqui a partir da tela de
// Criaturas, com o personagem de origem (e o clone existente, se já houver)
// via location.state.
const EditarCriaturaClone = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAdmin, loadingPermissions } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const personagem = location.state?.personagem ?? null;
  const cloneParaEditar = location.state?.clone ?? null;
  const isEditing = Boolean(cloneParaEditar);

  const podeEscrever =
    !loadingCampanhas &&
    campanhaAtiva &&
    (isAdmin || campanhaAtiva.mestreId === currentUser.uid);

  useEffect(() => {
    if (loadingPermissions || loadingCampanhas) return;
    if (!campanhaAtiva || !podeEscrever || !personagem)
      navigate(ROUTE_PATHS.CRIATURAS);
  }, [
    loadingPermissions,
    loadingCampanhas,
    campanhaAtiva,
    podeEscrever,
    personagem,
    navigate,
  ]);

  if (
    loadingCampanhas ||
    loadingPermissions ||
    !campanhaAtiva ||
    !podeEscrever ||
    !personagem
  ) {
    return null;
  }

  const initialValues = isEditing
    ? { ...CRIATURA_INITIAL_VALUES, ...cloneParaEditar }
    : {
        ...CRIATURA_INITIAL_VALUES,
        origemPersonagemId: personagem.id,
        nome: personagem.nome ?? '',
        linkImagem: personagem.linkImagem ?? '',
        descricaoBase: personagem.descricao ?? '',
      };

  const handleSubmit = async (values, { setSubmitting }) => {
    if (isEditing) {
      await updateRmCampanhaCriatura(
        campanhaAtiva.id,
        cloneParaEditar.id,
        values,
      );
    } else {
      await addRmCampanhaCriatura(campanhaAtiva.id, {
        ...values,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
      });
    }
    setSubmitting(false);
    navigate(ROUTE_PATHS.CRIATURAS);
  };

  return (
    <Box className="page-container">
      <FormPageHeader
        titulo={
          isEditing
            ? `Editar clone de ${personagem.nome}`
            : `Clonar ${personagem.nome}`
        }
        subtitulo={`${campanhaAtiva.nome}`}
        onVoltar={() => navigate(ROUTE_PATHS.CRIATURAS)}
      />

      <CriaturaForm
        initialValues={initialValues}
        personagem={personagem}
        onSubmit={handleSubmit}
        onCancelar={() => navigate(ROUTE_PATHS.CRIATURAS)}
        labelSalvar={isEditing ? 'Salvar Alterações' : 'Salvar Clone'}
      />
    </Box>
  );
};

export default EditarCriaturaClone;
