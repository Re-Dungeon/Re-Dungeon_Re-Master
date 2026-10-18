import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { CENA_NOME_MAX, validarNomeCena } from 'common/utils/grid';

const SEM_MAPA = '';

/**
 * Nome de uma cena do Grid — ao criar ("Nova cena") também dá para partir de
 * um dos Mapas da campanha (preenche nome e imagem) e já trazer os tokens de
 * todos os jogadores; ao renomear, só o nome. Quem monta usa `key` para
 * recomeçar o formulário a cada abertura.
 */
const CenaDialog = ({
  open,
  titulo,
  nomeInicial = '',
  mapas = null,
  rotuloConfirmar,
  onConfirmar,
  onClose,
}) => {
  const criando = mapas !== null;
  const [nome, setNome] = useState(nomeInicial);
  const [mapaId, setMapaId] = useState(SEM_MAPA);
  const [adicionarJogadores, setAdicionarJogadores] = useState(true);
  const [tocado, setTocado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const erro = validarNomeCena(nome);

  const escolherMapa = event => {
    const id = event.target.value;
    setMapaId(id);
    const mapa = mapas.find(m => m.id === id);
    if (mapa && !nome.trim()) setNome(mapa.nome ?? '');
  };

  const handleConfirmar = async event => {
    event.preventDefault();
    setTocado(true);
    if (erro) return;
    setSalvando(true);
    try {
      await onConfirmar({
        nome: nome.trim(),
        imagemUrl: mapas?.find(m => m.id === mapaId)?.linkImagem ?? null,
        adicionarJogadores: criando && adicionarJogadores,
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleConfirmar} noValidate>
        <DialogTitle>{titulo}</DialogTitle>
        <DialogContent
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
        >
          {criando && mapas.length > 0 && (
            <TextField
              select
              size="small"
              label="Mapa da campanha (opcional)"
              value={mapaId}
              onChange={escolherMapa}
              sx={{ mt: 1 }}
            >
              <MenuItem value={SEM_MAPA}>Sem imagem por enquanto</MenuItem>
              {mapas.map(mapa => (
                <MenuItem key={mapa.id} value={mapa.id}>
                  {mapa.nome}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            size="small"
            label="Nome da cena"
            value={nome}
            onChange={event => setNome(event.target.value)}
            onBlur={() => setTocado(true)}
            error={tocado && Boolean(erro)}
            helperText={tocado && erro ? erro : ' '}
            slotProps={{ htmlInput: { maxLength: CENA_NOME_MAX } }}
            sx={criando && mapas.length > 0 ? null : { mt: 1 }}
          />
          {criando && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={adicionarJogadores}
                  onChange={event =>
                    setAdicionarJogadores(event.target.checked)
                  }
                />
              }
              label="Adicionar todos os jogadores"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={salvando}>
            {rotuloConfirmar}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

CenaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  titulo: PropTypes.string.isRequired,
  nomeInicial: PropTypes.string,
  // Presente (mesmo vazio) = criando uma cena nova.
  mapas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nome: PropTypes.string,
      linkImagem: PropTypes.string.isRequired,
    }),
  ),
  rotuloConfirmar: PropTypes.string.isRequired,
  onConfirmar: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CenaDialog;
