import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import { useCampanha } from 'context/CampanhaContext';
import { useSnackbar } from 'context/SnackbarContext';
import {
  addRmCardfluxExploracao,
  getRmCardfluxExploracoesPorCampanha,
  removeRmCardfluxExploracao,
  updateRmCardfluxExploracao,
} from 'service/storage';
import { ROUTE_PATHS } from 'common/constants/routes';
import useAsyncEffect from 'hooks/useAsyncEffect';

const cardSx = {
  p: 2,
  background: 'linear-gradient(180deg, rgba(20, 24, 30, 0.98), rgba(12,15,20,0.98))',
  border: '1px solid var(--border-primary)',
  borderRadius: 3,
  boxShadow: '0 18px 32px rgba(0,0,0,0.18)',
};

const primaryButtonSx = {
  minHeight: '44px',
  borderRadius: 2,
  background: 'linear-gradient(135deg, var(--color-accent), #ab2b27)',
  color: 'var(--text-primary)',
  fontWeight: 700,
  textTransform: 'uppercase',
};

const secondaryButtonSx = {
  minHeight: '42px',
  borderRadius: 2,
  color: 'var(--text-primary)',
  border: '1px solid rgba(196,58,47,0.3)',
  background: 'rgba(196,58,47,0.06)',
  fontWeight: 700,
  textTransform: 'uppercase',
};

const dialogSx = {
  '& .MuiDialog-paper': {
    background: 'linear-gradient(180deg, rgba(18,22,30,0.98), rgba(10,13,20,0.98))',
    border: '1px solid rgba(196,58,47,0.28)',
    borderRadius: 3,
    boxShadow: '0 16px 44px rgba(0,0,0,0.25)',
  },
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    background: 'rgba(8,11,17,0.72)',
    borderRadius: 2,
    color: 'var(--text-primary)',
    '& fieldset': { borderColor: 'var(--border-primary)' },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': {
      borderColor: 'var(--color-accent)',
      boxShadow: '0 0 0 3px rgba(196,58,47,0.12)',
    },
  },
};

const cloneSnapshot = valor => JSON.parse(JSON.stringify(valor ?? {}));

const CardFluxExploracaoManager = () => {
  const navigate = useNavigate();
  const { campanhaAtiva } = useCampanha();
  const { notifyError } = useSnackbar();
  const [exploracoes, setExploracoes] = useState([]);
  const [dialog, setDialog] = useState({
    open: false,
    mode: 'rename',
    item: null,
    nome: '',
    loading: false,
    error: '',
  });
  const [feedback, setFeedback] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const carregarExploracoes = async () => {
    if (!campanhaAtiva) {
      setExploracoes([]);
      return;
    }

    const itens = await getRmCardfluxExploracoesPorCampanha(
      campanhaAtiva.id,
      campanhaAtiva.universoId,
      campanhaAtiva.mestreId,
    );
    setExploracoes(itens);
  };

  useAsyncEffect(carregarExploracoes, [campanhaAtiva]);

  const totalAtivas = useMemo(
    () => exploracoes.filter(item => item.status !== 'encerrada').length,
    [exploracoes],
  );

  const fecharDialog = () => {
    setDialog({
      open: false,
      mode: 'rename',
      item: null,
      nome: '',
      loading: false,
      error: '',
    });
  };

  const abrirDialog = (mode, item, nomeInicial = '') => {
    setDialog({
      open: true,
      mode,
      item,
      nome: nomeInicial,
      loading: false,
      error: '',
    });
  };

  const handleNova = () => {
    navigate(ROUTE_PATHS.CARDFLUX_EXPLORACAO_CONFIG);
  };

  const handleVoltar = () => {
    navigate(ROUTE_PATHS.CARDFLUX);
  };

  const handleAbrir = item => {
    navigate(ROUTE_PATHS.CARDFLUX_EXPLORACAO.replace(':exploracaoId', item.id), {
      state: { exploracao: item },
    });
  };

  const handleOpenRename = item => abrirDialog('rename', item, item.nome);

  const handleOpenDuplicate = item =>
    abrirDialog('duplicate', item, `${item.nome} (Cópia)`);

  const handleOpenStatus = item => abrirDialog('status', item, item.nome);

  const handleOpenDelete = item => abrirDialog('delete', item, item.nome);

  const handleSalvarNome = async () => {
    if (!dialog.item) return;

    const nome = dialog.nome.trim();
    const nomeOriginal = dialog.item.nome.trim();
    if (!nome || nome === nomeOriginal) {
      setDialog(prev => ({
        ...prev,
        error: 'Informe um nome válido.',
      }));
      return;
    }

    setDialog(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const atualizada = { ...dialog.item, nome };
      await updateRmCardfluxExploracao(dialog.item.id, atualizada);
      setExploracoes(prev =>
        prev.map(exploracao =>
          exploracao.id === dialog.item.id ? { ...atualizada } : exploracao,
        ),
      );
      setFeedback({
        open: true,
        message: 'Exploração renomeada com sucesso.',
        severity: 'success',
      });
      fecharDialog();
    } catch (error) {
      const mensagem = error?.message || 'Não foi possível renomear a exploração.';
      setDialog(prev => ({ ...prev, loading: false, error: mensagem }));
      notifyError(mensagem);
    }
  };

  const handleDuplicar = async () => {
    if (!dialog.item) return;

    const nome = dialog.nome.trim();
    if (!nome) {
      setDialog(prev => ({
        ...prev,
        error: 'Informe um nome válido para a cópia.',
      }));
      return;
    }

    setDialog(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const snapshot = cloneSnapshot(dialog.item);
      delete snapshot.id;

      const duplicada = {
        ...snapshot,
        nome,
        campanhaId: campanhaAtiva.id,
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
        status: 'ativa',
        historico: Array.isArray(snapshot.historico)
          ? cloneSnapshot(snapshot.historico)
          : [],
        resultados: snapshot.resultados ? cloneSnapshot(snapshot.resultados) : {},
        quadrantes: snapshot.quadrantes ? cloneSnapshot(snapshot.quadrantes) : [],
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

      const salvo = await addRmCardfluxExploracao(duplicada);
      setExploracoes(prev => [{ ...duplicada, id: salvo.id }, ...prev]);
      setFeedback({
        open: true,
        message: 'Exploração duplicada com sucesso.',
        severity: 'success',
      });
      fecharDialog();
    } catch (error) {
      const mensagem = error?.message || 'Não foi possível duplicar a exploração.';
      setDialog(prev => ({ ...prev, loading: false, error: mensagem }));
      notifyError(mensagem);
    }
  };

  const handleStatus = async () => {
    if (!dialog.item) return;

    setDialog(prev => ({ ...prev, loading: true, error: '' }));

    try {
      const proximoStatus = dialog.item.status === 'encerrada' ? 'ativa' : 'encerrada';
      const atualizada = { ...dialog.item, status: proximoStatus };
      await updateRmCardfluxExploracao(dialog.item.id, atualizada);
      setExploracoes(prev =>
        prev.map(exploracao =>
          exploracao.id === dialog.item.id ? { ...atualizada } : exploracao,
        ),
      );
      setFeedback({
        open: true,
        message:
          proximoStatus === 'encerrada'
            ? 'Exploração encerrada com sucesso.'
            : 'Exploração reativada com sucesso.',
        severity: 'success',
      });
      fecharDialog();
    } catch (error) {
      const mensagem = error?.message || 'Não foi possível alterar o status da exploração.';
      setDialog(prev => ({ ...prev, loading: false, error: mensagem }));
      notifyError(mensagem);
    }
  };

  const handleExcluir = async () => {
    if (!dialog.item) return;

    setDialog(prev => ({ ...prev, loading: true, error: '' }));

    try {
      await removeRmCardfluxExploracao(dialog.item.id);
      setExploracoes(prev => prev.filter(exploracao => exploracao.id !== dialog.item.id));
      setFeedback({
        open: true,
        message: 'Exploração removida com sucesso.',
        severity: 'success',
      });
      fecharDialog();
    } catch (error) {
      const mensagem = error?.message || 'Não foi possível excluir a exploração.';
      setDialog(prev => ({ ...prev, loading: false, error: mensagem }));
      notifyError(mensagem);
    }
  };

  const fecharFeedback = () => setFeedback(prev => ({ ...prev, open: false }));

  const getDialogTitle = () => {
    if (dialog.mode === 'rename') return 'Renomear exploração';
    if (dialog.mode === 'duplicate') return 'Duplicar exploração';
    if (dialog.mode === 'delete') return 'Excluir exploração';
    if (dialog.mode === 'status' && dialog.item?.status === 'encerrada') return 'Reativar exploração';
    return 'Encerrar exploração';
  };

  const getDialogDescription = () => {
    if (dialog.mode === 'rename') return 'Atualize o nome da exploração sem perder seu histórico e estado atual.';
    if (dialog.mode === 'duplicate') return 'A cópia será gerada como uma exploração independente com o mesmo grid e resultados.';
    if (dialog.mode === 'delete') return `A exclusão é definitiva e removerá somente esta exploração selecionada.`;
    if (dialog.mode === 'status' && dialog.item?.status === 'encerrada') return 'A exploração será reativada e o progresso anterior será restaurado.';
    return 'Encerrar não apaga os dados; o histórico e os quadrantes permanecerão preservados.';
  };

  const renderDialogContent = () => {
    if (dialog.mode === 'rename' || dialog.mode === 'duplicate') {
      return (
        <>
          <DialogContentText sx={{ color: 'var(--text-secondary)', mb: 2 }}>
            {getDialogDescription()}
          </DialogContentText>
          <TextField
            fullWidth
            label="Novo nome da exploração"
            value={dialog.nome}
            onChange={event => {
              const valor = event.target.value;
              setDialog(prev => ({
                ...prev,
                nome: valor,
                error: valor.trim() ? '' : 'Informe um nome válido.',
              }));
            }}
            sx={fieldSx}
            error={Boolean(dialog.error)}
            helperText={dialog.error || ' '}
          />
        </>
      );
    }

    return (
      <DialogContentText sx={{ color: 'var(--text-secondary)' }}>
        {getDialogDescription()}
        {dialog.item?.nome ? `\n\nExploração: ${dialog.item.nome}` : ''}
      </DialogContentText>
    );
  };

  const getConfirmLabel = () => {
    if (dialog.mode === 'delete') return 'Confirmar exclusão';
    if (dialog.mode === 'status') {
      return dialog.item?.status === 'encerrada' ? 'Reativar' : 'Encerrar';
    }
    return 'Confirmar';
  };

  const isConfirmDisabled = () => {
    if (dialog.loading) return true;
    if (dialog.mode === 'rename') {
      return !dialog.nome.trim() || dialog.nome.trim() === dialog.item?.nome.trim();
    }
    if (dialog.mode === 'duplicate') {
      return !dialog.nome.trim();
    }
    return false;
  };

  const handleConfirmDialog = () => {
    if (dialog.mode === 'rename') {
      handleSalvarNome();
      return;
    }
    if (dialog.mode === 'duplicate') {
      handleDuplicar();
      return;
    }
    if (dialog.mode === 'status') {
      handleStatus();
      return;
    }
    handleExcluir();
  };

  if (!campanhaAtiva) return null;

  return (
    <>
      <Box className="page-container" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'var(--color-accent)', fontWeight: 800, letterSpacing: '0.12em' }}>
              Gerenciador
            </Typography>
            <Typography variant="h4" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
              Explorações de CardFlux
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={handleVoltar} sx={secondaryButtonSx}>
              Voltar
            </Button>
            <Button variant="contained" onClick={handleNova} sx={primaryButtonSx}>
              Nova exploração
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0,1fr))' }, gap: 2, mb: 3 }}>
          <Paper sx={cardSx}>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Total
            </Typography>
            <Typography variant="h4" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>{exploracoes.length}</Typography>
          </Paper>
          <Paper sx={cardSx}>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Ativas
            </Typography>
            <Typography variant="h4" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>{totalAtivas}</Typography>
          </Paper>
          <Paper sx={cardSx}>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Campanha
            </Typography>
            <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 700 }}>{campanhaAtiva.nome}</Typography>
          </Paper>
        </Box>

        <Box sx={{ display: 'grid', gap: 2 }}>
          {exploracoes.length === 0 ? (
            <Paper sx={cardSx}>
              <Typography sx={{ color: 'var(--text-secondary)' }}>
                Nenhuma exploração salva nesta campanha.
              </Typography>
            </Paper>
          ) : (
            exploracoes.map(exploracao => {
              const quadrantes = Array.isArray(exploracao.quadrantes)
                ? exploracao.quadrantes.flat().filter(Boolean)
                : [];
              const totalDescobertos = quadrantes.filter(item => item.cartaId || item.resultado).length;
              const percent = quadrantes.length ? (totalDescobertos / quadrantes.length) * 100 : 0;
              const encerrada = exploracao.status === 'encerrada';

              return (
                <Paper key={exploracao.id} sx={cardSx}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
                        {exploracao.nome}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                        {exploracao.dimensoes?.linhas || 0}x{exploracao.dimensoes?.colunas || 0} · {exploracao.baralhos?.join(', ') || 'Sem baralho'}
                      </Typography>
                    </Box>
                    <Chip
                      label={encerrada ? 'Encerrada' : 'Ativa'}
                      size="small"
                      sx={{
                        background: encerrada ? 'rgba(255,255,255,0.05)' : 'rgba(196,58,47,0.12)',
                        border: '1px solid rgba(196,58,47,0.2)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                      Progresso: {Math.round(percent)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
                      {exploracao.configuracao?.modo || 'predefinida'} · {exploracao.configuracao?.densidade || 0}%
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="contained" onClick={() => handleAbrir(exploracao)} sx={primaryButtonSx}>
                      Continuar
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleOpenRename(exploracao)}
                      sx={secondaryButtonSx}
                      disabled={encerrada}
                    >
                      Renomear
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleOpenDuplicate(exploracao)}
                      sx={secondaryButtonSx}
                      disabled={encerrada}
                    >
                      Duplicar
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleOpenStatus(exploracao)}
                      sx={secondaryButtonSx}
                    >
                      {encerrada ? 'Reativar' : 'Encerrar'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleOpenDelete(exploracao)}
                      sx={{ ...secondaryButtonSx, borderColor: 'rgba(255,96,96,0.35)' }}
                      disabled={encerrada}
                    >
                      Excluir
                    </Button>
                  </Box>
                </Paper>
              );
            })
          )}
        </Box>
      </Box>

      <Dialog
        open={dialog.open}
        onClose={() => {
          if (!dialog.loading) fecharDialog();
        }}
        sx={dialogSx}
        aria-labelledby="cardflux-exploracao-dialog-title"
      >
        <DialogTitle id="cardflux-exploracao-dialog-title" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
          {getDialogTitle()}
        </DialogTitle>
        <DialogContent>
          {renderDialogContent()}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid var(--border-primary)' }}>
          <Button
            onClick={fecharDialog}
            variant="text"
            disabled={dialog.loading}
            sx={{ color: 'var(--text-secondary)' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDialog}
            disabled={isConfirmDisabled()}
            sx={primaryButtonSx}
          >
            {dialog.loading ? 'Salvando...' : getConfirmLabel()}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={fecharFeedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={feedback.severity} onClose={fecharFeedback} variant="filled">
          {feedback.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CardFluxExploracaoManager;
