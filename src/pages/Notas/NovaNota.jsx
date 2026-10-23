import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { useSnackbar } from 'context/SnackbarContext';
import { addRmNota, getRmNotasPorCampanha, updateRmNota } from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import FormPageHeader from 'components/FormPageHeader/FormPageHeader';
import NotaForm from './NotaForm';
import { NOTA_INITIAL_VALUES, normalizeNotaTags } from './notaUtils';

const NovaNota = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { notaId } = useParams();
  const { currentUser, isAdmin, loadingPermissions } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();
  const { notifyError, notifySuccess } = useSnackbar();
  const [notaCarregada, setNotaCarregada] = useState(location.state?.nota ?? null);
  const [carregandoNotaEdit, setCarregandoNotaEdit] = useState(
    Boolean(notaId && !location.state?.nota),
  );
  const notaParaEditar = location.state?.nota ?? notaCarregada;
  const isEditing = Boolean(notaParaEditar || notaId);

  const podeEscrever =
    !loadingCampanhas &&
    campanhaAtiva &&
    (isAdmin || campanhaAtiva.mestreId === currentUser.uid);

  useEffect(() => {
    if (loadingPermissions || loadingCampanhas) return;
    if (!campanhaAtiva || !podeEscrever) navigate(ROUTE_PATHS.NOTAS);
  }, [
    loadingPermissions,
    loadingCampanhas,
    campanhaAtiva,
    podeEscrever,
    navigate,
  ]);

  useEffect(() => {
    if (!campanhaAtiva || !notaId || location.state?.nota) return;

    let isMounted = true;
    getRmNotasPorCampanha(
      campanhaAtiva.id,
      campanhaAtiva.universoId,
      campanhaAtiva.mestreId,
    )
      .then(notasCampanha => {
        if (!isMounted) return;
        const notaEncontrada =
          notasCampanha.find(item => item.id === notaId) ?? null;
        setNotaCarregada(notaEncontrada);
        setCarregandoNotaEdit(false);

        if (!notaEncontrada) {
          navigate(ROUTE_PATHS.NOTAS, { replace: true });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setNotaCarregada(null);
        setCarregandoNotaEdit(false);
        navigate(ROUTE_PATHS.NOTAS, { replace: true });
      });

    return () => {
      isMounted = false;
    };
  }, [campanhaAtiva, location.state?.nota, navigate, notaId]);

  const editInitialValues = notaParaEditar
    ? {
        ...NOTA_INITIAL_VALUES,
        ...notaParaEditar,
        tags:
          Array.isArray(notaParaEditar.tags)
            ? normalizeNotaTags(notaParaEditar.tags).join(', ')
            : notaParaEditar.tags ?? '',
      }
    : NOTA_INITIAL_VALUES;

  const tituloNota = notaParaEditar?.titulo ?? 'Entidade';

  if (notaId && !notaParaEditar && (carregandoNotaEdit || loadingCampanhas || loadingPermissions)) {
    return null;
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    const payload = {
      ...values,
      tags: normalizeNotaTags(values.tags),
      resumo: values.resumo ?? '',
      imagemUrl: values.imagemUrl ?? '',
      tipo: values.tipo ?? 'Local',
      conteudo: values.conteudo ?? '',
      titulo: values.titulo ?? '',
    };

    try {
      if (isEditing) {
        await updateRmNota((notaParaEditar || notaCarregada).id, payload);
      } else {
        await addRmNota({
          ...payload,
          campanhaId: campanhaAtiva.id,
          universoId: campanhaAtiva.universoId,
          mestreId: campanhaAtiva.mestreId,
        });
      }

      notifySuccess('✓ Alterações salvas com sucesso');
      navigate(ROUTE_PATHS.NOTAS);
    } catch (error) {
      const mensagemErro =
        error?.message || 'Não foi possível salvar as alterações. Tente novamente.';

      // eslint-disable-next-line no-console
      console.error('Erro ao salvar nota:', error);
      notifyError(mensagemErro);
    } finally {
      setSubmitting(false);
    }
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
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Universo / {isEditing ? 'Editar entidade' : 'Nova entidade'}
        </Typography>
      </Box>

      <FormPageHeader
        titulo={isEditing ? 'Editar Nota' : 'Nova Nota'}
        subtitulo={
          isEditing
            ? `Editando "${tituloNota}" em ${campanhaAtiva.nome}`
            : `Nova nota em ${campanhaAtiva.nome}`
        }
        onVoltar={() => navigate(ROUTE_PATHS.NOTAS)}
      />

      <NotaForm
        initialValues={editInitialValues}
        campanhaId={campanhaAtiva.id}
        universoId={campanhaAtiva.universoId}
        mestreId={campanhaAtiva.mestreId}
        onSubmit={handleSubmit}
        onCancelar={() => navigate(ROUTE_PATHS.NOTAS)}
        labelSalvar={isEditing ? 'Salvar Alterações' : 'Salvar Nota'}
        idPrefix="nova-nota"
      />
    </Box>
  );
};

export default NovaNota;
