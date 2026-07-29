import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { addRmNpc, updateRmNpc, getPersonagens } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import FormPageHeader from 'components/FormPageHeader/FormPageHeader';
import NpcForm from './NpcForm';
import { NPC_INITIAL_VALUES } from './npcUtils';

const NovoNpc = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { canWrite, loadingPermissions } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const npcParaEditar = location.state?.npc ?? null;
  const isEditing = Boolean(npcParaEditar);

  const [personagens, setPersonagens] = useState([]);

  const podeEscrever =
    !loadingCampanhas && campanhaAtiva && canWrite(campanhaAtiva.universoId);

  useEffect(() => {
    if (loadingPermissions || loadingCampanhas) return;
    if (!campanhaAtiva || !podeEscrever) navigate(ROUTE_PATHS.NPCS);
  }, [loadingPermissions, loadingCampanhas, campanhaAtiva, podeEscrever, navigate]);

  useEffect(() => {
    if (!campanhaAtiva) return;
    Promise.resolve().then(() =>
      getPersonagens().then(todos =>
        setPersonagens(todos.filter(p => p.universo === campanhaAtiva.universoId)),
      ),
    );
  }, [campanhaAtiva]);

  const editInitialValues = npcParaEditar
    ? { ...NPC_INITIAL_VALUES, ...npcParaEditar }
    : NPC_INITIAL_VALUES;

  const handleSubmit = async (values, { setSubmitting }) => {
    if (isEditing) {
      await updateRmNpc(npcParaEditar.id, values);
    } else {
      await addRmNpc({
        ...values,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
      });
    }
    setSubmitting(false);
    navigate(ROUTE_PATHS.NPCS);
  };

  if (loadingCampanhas || loadingPermissions || !campanhaAtiva || !podeEscrever) {
    return null;
  }

  return (
    <Box className="page-container">
      <FormPageHeader
        titulo={isEditing ? 'Editar NPC' : 'Novo NPC'}
        subtitulo={
          isEditing
            ? `Editando "${npcParaEditar.nome}" em ${campanhaAtiva.nome}`
            : `Novo NPC em ${campanhaAtiva.nome}`
        }
        onVoltar={() => navigate(ROUTE_PATHS.NPCS)}
      />

      <NpcForm
        initialValues={editInitialValues}
        personagens={personagens}
        onSubmit={handleSubmit}
        onCancelar={() => navigate(ROUTE_PATHS.NPCS)}
        labelSalvar={isEditing ? 'Salvar Alterações' : 'Salvar NPC'}
        idPrefix="novo-npc"
      />
    </Box>
  );
};

export default NovoNpc;
