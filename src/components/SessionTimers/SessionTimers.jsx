import React, { useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import AddIcon from '@mui/icons-material/Add';
import {
  formatDuracao,
  parseDuracaoParaSegundos,
  tickTimer,
} from './sessionTimersUtils';

let proximoIdTimer = 1;

const linhaSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
};

// Widget flutuante (acionado pelo Header, disponível em qualquer tela): o
// cronômetro de quanto tempo a mesa já está rodando, mais temporizadores
// nomeados avulsos ("a ponte desaba em 3 rodadas", "o veneno age em 10
// minutos"). Estado 100% local/efêmero — de propósito não é persistido no
// Firestore, já que não faz sentido retomar a mesma contagem numa sessão
// futura, e evita gravações a cada segundo.
const SessionTimers = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [sessaoSegundos, setSessaoSegundos] = useState(0);
  const [sessaoRodando, setSessaoRodando] = useState(false);
  const [timers, setTimers] = useState([]);
  const [novoRotulo, setNovoRotulo] = useState('');
  const [novoMinutos, setNovoMinutos] = useState('');
  const [novoSegundos, setNovoSegundos] = useState('');

  const algumTimerRodando = timers.some(t => t.running);
  const rodandoAgora = sessaoRodando || algumTimerRodando;

  useEffect(() => {
    if (!rodandoAgora) return undefined;
    const intervalId = setInterval(() => {
      if (sessaoRodando) setSessaoSegundos(s => s + 1);
      setTimers(prev => prev.map(tickTimer));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [rodandoAgora, sessaoRodando]);

  const handleAdicionarTimer = () => {
    const duracaoSegundos = parseDuracaoParaSegundos(novoMinutos, novoSegundos);
    if (duracaoSegundos <= 0) return;
    setTimers(prev => [
      ...prev,
      {
        id: proximoIdTimer++,
        rotulo: novoRotulo.trim() || 'Temporizador',
        duracaoSegundos,
        restanteSegundos: duracaoSegundos,
        running: true,
        esgotado: false,
      },
    ]);
    setNovoRotulo('');
    setNovoMinutos('');
    setNovoSegundos('');
  };

  const alternarTimer = id => {
    setTimers(prev =>
      prev.map(t =>
        t.id === id ? { ...t, running: !t.running, esgotado: false } : t,
      ),
    );
  };

  const resetarTimer = id => {
    setTimers(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              restanteSegundos: t.duracaoSegundos,
              running: false,
              esgotado: false,
            }
          : t,
      ),
    );
  };

  const removerTimer = id => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      <IconButton
        onClick={e => setAnchorEl(e.currentTarget)}
        sx={{
          color: rodandoAgora ? 'var(--color-accent)' : 'var(--text-secondary)',
        }}
        aria-label="Cronômetro de sessão e temporizadores"
      >
        <TimerOutlinedIcon />
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 280, background: 'var(--bg-card)' }}>
          <Typography
            variant="caption"
            sx={{
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Tempo de Sessão
          </Typography>
          <Box
            sx={{
              ...linhaSx,
              justifyContent: 'space-between',
              mt: 0.5,
              mb: 1.5,
            }}
          >
            <Typography
              variant="h5"
              sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
            >
              {formatDuracao(sessaoSegundos)}
            </Typography>
            <Box>
              <IconButton
                size="small"
                onClick={() => setSessaoRodando(r => !r)}
                sx={{ color: 'var(--color-accent)' }}
                aria-label={
                  sessaoRodando
                    ? 'Pausar tempo de sessão'
                    : 'Iniciar tempo de sessão'
                }
              >
                {sessaoRodando ? (
                  <PauseIcon fontSize="small" />
                ) : (
                  <PlayArrowIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton
                size="small"
                onClick={() => {
                  setSessaoRodando(false);
                  setSessaoSegundos(0);
                }}
                sx={{ color: 'var(--text-secondary)' }}
                aria-label="Zerar tempo de sessão"
              >
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'var(--border-primary)', mb: 1.5 }} />

          <Typography
            variant="caption"
            sx={{
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            Temporizadores
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              mt: 1,
              mb: 1.5,
            }}
          >
            {timers.length === 0 ? (
              <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                Nenhum temporizador ativo.
              </Typography>
            ) : (
              timers.map(timer => (
                <Box
                  key={timer.id}
                  sx={{ ...linhaSx, justifyContent: 'space-between' }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ color: 'var(--text-primary)', fontWeight: 600 }}
                    >
                      {timer.rotulo}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: timer.esgotado
                          ? '#ef4444'
                          : 'var(--text-secondary)',
                        fontWeight: timer.esgotado ? 700 : 400,
                      }}
                    >
                      {timer.esgotado
                        ? 'Esgotado!'
                        : formatDuracao(timer.restanteSegundos)}
                    </Typography>
                  </Box>
                  <Box sx={{ flexShrink: 0 }}>
                    <IconButton
                      size="small"
                      onClick={() => alternarTimer(timer.id)}
                      disabled={timer.esgotado}
                      sx={{ color: 'var(--color-accent)' }}
                      aria-label={
                        timer.running
                          ? `Pausar temporizador ${timer.rotulo}`
                          : `Iniciar temporizador ${timer.rotulo}`
                      }
                    >
                      {timer.running ? (
                        <PauseIcon fontSize="small" />
                      ) : (
                        <PlayArrowIcon fontSize="small" />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => resetarTimer(timer.id)}
                      sx={{ color: 'var(--text-secondary)' }}
                      aria-label={`Reiniciar temporizador ${timer.rotulo}`}
                    >
                      <RestartAltIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => removerTimer(timer.id)}
                      sx={{ color: '#ef4444' }}
                      aria-label={`Remover temporizador ${timer.rotulo}`}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))
            )}
          </Box>

          <Divider sx={{ borderColor: 'var(--border-primary)', mb: 1.5 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Rótulo (ex.: a ponte desaba)"
              value={novoRotulo}
              onChange={e => setNovoRotulo(e.target.value)}
              slotProps={{
                htmlInput: { 'aria-label': 'Rótulo do novo temporizador' },
              }}
            />
            <Box sx={linhaSx}>
              <TextField
                size="small"
                type="number"
                placeholder="min"
                value={novoMinutos}
                onChange={e => setNovoMinutos(e.target.value)}
                sx={{ width: 80 }}
                slotProps={{
                  htmlInput: {
                    min: 0,
                    'aria-label': 'Minutos do novo temporizador',
                  },
                }}
              />
              <TextField
                size="small"
                type="number"
                placeholder="seg"
                value={novoSegundos}
                onChange={e => setNovoSegundos(e.target.value)}
                sx={{ width: 80 }}
                slotProps={{
                  htmlInput: {
                    min: 0,
                    max: 59,
                    'aria-label': 'Segundos do novo temporizador',
                  },
                }}
              />
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon fontSize="small" />}
                onClick={handleAdicionarTimer}
                sx={{
                  background: 'var(--color-primary)',
                  '&:hover': { background: '#5a2090' },
                }}
              >
                Adicionar
              </Button>
            </Box>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default SessionTimers;
