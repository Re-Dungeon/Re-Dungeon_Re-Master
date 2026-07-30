import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { addRmCampanhaJogador, updateRmCampanhaJogador } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import FormPageHeader from 'components/FormPageHeader/FormPageHeader';
import JogadorForm from './JogadorForm';
import { JOGADOR_INITIAL_VALUES } from './jogadoresUtils';

// Mesmo padrão de pages/Npcs/EditarNpcClone.jsx: preenche/edita os campos
// específicos da campanha para o clone de um Jogador (subcoleção
// rmCampanhas/{id}/jogadores). Sempre chegada aqui a partir da tela de
// Jogadores, com o personagem de origem (e o clone existente, se já houver)
// via location.state.
const EditarJogadorClone = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canWrite, loadingPermissions } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const personagem = location.state?.personagem ?? null;
  const cloneParaEditar = location.state?.clone ?? null;
  const isEditing = Boolean(cloneParaEditar);

  const podeEscrever =
    !loadingCampanhas && campanhaAtiva && canWrite(campanhaAtiva.universoId);

  useEffect(() => {
    if (loadingPermissions || loadingCampanhas) return;
    if (!campanhaAtiva || !podeEscrever || !personagem)
      navigate(ROUTE_PATHS.JOGADORES);
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
    ? { ...JOGADOR_INITIAL_VALUES, ...cloneParaEditar }
    : {
        ...JOGADOR_INITIAL_VALUES,
        origemPersonagemId: personagem.id,
        nome: personagem.nome ?? '',
        linkImagem: personagem.linkImagem ?? '',
        descricaoBase: personagem.descricao ?? '',
      };

  const handleSubmit = async (values, { setSubmitting }) => {
    if (isEditing) {
      await updateRmCampanhaJogador(
        campanhaAtiva.id,
        cloneParaEditar.id,
        values,
      );
    } else {
      await addRmCampanhaJogador(campanhaAtiva.id, {
        ...values,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
      });
    }
    setSubmitting(false);
    navigate(ROUTE_PATHS.JOGADORES);
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
        onVoltar={() => navigate(ROUTE_PATHS.JOGADORES)}
      />

      <JogadorForm
        initialValues={initialValues}
        personagem={personagem}
        onSubmit={handleSubmit}
        onCancelar={() => navigate(ROUTE_PATHS.JOGADORES)}
        labelSalvar={isEditing ? 'Salvar Alterações' : 'Salvar Clone'}
      />
    </Box>
  );
};

export default EditarJogadorClone;
