import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

import { audioPropType } from './audioPropType';

// Música da mesa: todos veem o que está tocando e ajustam o próprio volume
// (vale só para quem ajustou); o mestre também toca um link do YouTube,
// pausa/retoma, para e liga/desliga o "repetir".
const AudioDialog = ({ open, onClose, audio }) => {
  const [link, setLink] = useState('');
  const [repetirNovo, setRepetirNovo] = useState(true);
  const [erroLink, setErroLink] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const repetir = audio.tocando ? audio.repetir : repetirNovo;

  const handleTocar = async event => {
    event.preventDefault();
    setEnviando(true);
    try {
      const erro = await audio.tocar(link, repetir);
      setErroLink(erro);
      if (!erro) setLink('');
    } finally {
      setEnviando(false);
    }
  };

  const handleRepetir = event => {
    const valor = event.target.checked;
    setRepetirNovo(valor);
    if (audio.tocando) audio.setRepetir(valor);
  };

  let situacao = 'Nenhuma música tocando.';
  if (audio.tocando) {
    situacao = `${audio.titulo ?? 'Carregando o título…'}${audio.pausado ? ' (pausada)' : ''}`;
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>🎵 Música da mesa</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box role="status" aria-label="Música tocando">
          <Typography sx={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {situacao}
          </Typography>
          {audio.erroPlayer && (
            <Typography variant="body2" sx={{ color: 'error.main', mt: 0.5 }}>
              {audio.erroPlayer}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            aria-label={audio.mudo ? 'Ativar som' : 'Silenciar'}
            onClick={() => audio.setMudo(!audio.mudo)}
          >
            {audio.mudo ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </IconButton>
          <Slider
            aria-label="Volume da música"
            min={0}
            max={100}
            value={audio.volume}
            onChange={(_event, valor) => audio.setVolume(valor)}
            disabled={audio.mudo}
          />
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-secondary)', minWidth: 32 }}
          >
            {audio.volume}%
          </Typography>
        </Box>
        <Typography
          variant="caption"
          sx={{ color: 'var(--text-muted)', mt: -1.5 }}
        >
          O volume vale só para você, neste aparelho.
        </Typography>

        {audio.podeControlar && (
          <>
            <Divider />
            <Box
              component="form"
              onSubmit={handleTocar}
              noValidate
              sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
            >
              <TextField
                size="small"
                label="Link do YouTube"
                placeholder="https://www.youtube.com/watch?v=…"
                value={link}
                onChange={event => {
                  setLink(event.target.value);
                  setErroLink(null);
                }}
                error={Boolean(erroLink)}
                helperText={
                  erroLink ?? 'Toca para todos com o chat da campanha aberto.'
                }
              />
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch checked={repetir} onChange={handleRepetir} />
                  }
                  label="Repetir"
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={!link.trim() || enviando}
                >
                  Tocar
                </Button>
              </Box>
            </Box>
            {audio.tocando && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {audio.pausado ? (
                  <Button variant="outlined" onClick={audio.retomar}>
                    Retomar
                  </Button>
                ) : (
                  <Button variant="outlined" onClick={audio.pausar}>
                    Pausar
                  </Button>
                )}
                <Button color="error" onClick={audio.parar}>
                  Parar
                </Button>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

AudioDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  audio: audioPropType.isRequired,
};

export default AudioDialog;
