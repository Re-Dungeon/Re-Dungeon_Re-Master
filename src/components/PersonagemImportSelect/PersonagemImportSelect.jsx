import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { getTipoPersonagem } from 'common/utils/personagemTipo';

const selectSx = {
  color: 'var(--text-primary)',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-primary)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--border-hover)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--color-accent)' },
  '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
};

const menuPropsSx = {
  paper: { sx: { background: 'var(--bg-card)', color: 'var(--text-primary)' } },
};

/**
 * Seletor de importação reaproveitado por NPCs e Criaturas: lista os
 * personagens do Universo da campanha ativa filtrados por `tipo`
 * ("NPC"/"Criatura") e, ao importar, repassa o documento inteiro para o
 * formulário preencher nome/imagem/descrição — sem alterar a ficha original.
 */
const PersonagemImportSelect = ({ personagens, tipo, onImport, idPrefix }) => {
  const [selecionadoId, setSelecionadoId] = useState('');
  const disponiveis = personagens.filter(p => getTipoPersonagem(p) === tipo);
  const labelId = `${idPrefix}-import-label`;

  if (disponiveis.length === 0) {
    return (
      <Typography
        variant="body2"
        sx={{
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          p: 2,
          background: 'var(--bg-secondary)',
          borderRadius: 1,
        }}
      >
        Nenhum personagem do tipo &quot;{tipo}&quot; encontrado no Universo
        desta campanha. Você ainda pode criar do zero abaixo.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: 240 }}>
        <InputLabel id={labelId} sx={{ color: 'var(--text-secondary)' }}>
          Importar de um personagem
        </InputLabel>
        <Select
          labelId={labelId}
          label="Importar de um personagem"
          value={selecionadoId}
          onChange={e => setSelecionadoId(e.target.value)}
          sx={selectSx}
          slotProps={menuPropsSx}
        >
          {disponiveis.map(p => (
            <MenuItem key={p.id} value={p.id}>
              {p.nome}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button
        disabled={!selecionadoId}
        onClick={() => {
          const personagem = disponiveis.find(p => p.id === selecionadoId);
          if (personagem) onImport(personagem);
          setSelecionadoId('');
        }}
        sx={{ color: 'var(--color-accent)' }}
      >
        Importar
      </Button>
    </Box>
  );
};

PersonagemImportSelect.propTypes = {
  personagens: PropTypes.arrayOf(PropTypes.object).isRequired,
  tipo: PropTypes.oneOf(['NPC', 'Criatura']).isRequired,
  onImport: PropTypes.func.isRequired,
  idPrefix: PropTypes.string.isRequired,
};

export default PersonagemImportSelect;
