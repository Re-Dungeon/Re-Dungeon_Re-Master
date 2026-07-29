import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { OPCOES_ORDENACAO_NOME, ORDEM_ASC } from 'common/utils/ordenacao';

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    color: 'var(--text-primary)',
    '& fieldset': { borderColor: 'var(--border-primary)' },
    '&:hover fieldset': { borderColor: 'var(--border-hover)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--color-accent)' },
  },
  '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--color-accent)' },
};

const inputLabelSx = {
  color: 'var(--text-secondary)',
  '&.Mui-focused': { color: 'var(--color-accent)' },
};

const selectSx = {
  color: 'var(--text-primary)',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--border-primary)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--border-hover)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--color-accent)',
  },
  '& .MuiSvgIcon-root': { color: 'var(--text-secondary)' },
};

const selectMenuProps = {
  PaperProps: {
    sx: { background: 'var(--bg-card)', color: 'var(--text-primary)' },
  },
};

/**
 * Grade de filtros repetida em toda página de listagem de entidade: busca
 * por nome, N campos de select dinâmicos (`extraFilters`) e um select de
 * Universo fixo ao final.
 */
const EntityFilters = ({
  nomeValue,
  onNomeChange,
  extraFilters = [],
  universos = [],
  universoValue,
  onUniversoChange,
  sortValue = ORDEM_ASC,
  onSortChange,
  sx = {},
  menuMaxHeight,
}) => {
  const menuProps = menuMaxHeight
    ? {
        PaperProps: {
          sx: { ...selectMenuProps.PaperProps.sx, maxHeight: menuMaxHeight },
        },
      }
    : selectMenuProps;
  const totalColunas = extraFilters.length + 1 + (onSortChange ? 1 : 0);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: `2fr repeat(${totalColunas}, 1fr)`,
        },
        gap: 2,
        mb: 3,
        ...sx,
      }}
    >
      <TextField
        label="Buscar por nome"
        size="small"
        value={nomeValue}
        onChange={e => onNomeChange(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={textFieldSx}
      />
      {extraFilters.map(filtro => {
        const labelId = `entity-filters-${filtro.label}`;
        return (
          <FormControl key={filtro.label} size="small">
            <InputLabel id={labelId} sx={inputLabelSx}>
              {filtro.label}
            </InputLabel>
            <Select
              labelId={labelId}
              label={filtro.label}
              value={filtro.value}
              onChange={e => filtro.onChange(e.target.value)}
              sx={selectSx}
              MenuProps={menuProps}
            >
              <MenuItem value="">{filtro.allLabel || 'Todos'}</MenuItem>
              {filtro.options.map(opcao => (
                <MenuItem key={opcao} value={opcao}>
                  {opcao}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      })}
      <FormControl size="small">
        <InputLabel id="entity-filters-universo" sx={inputLabelSx}>
          Universo
        </InputLabel>
        <Select
          labelId="entity-filters-universo"
          label="Universo"
          value={universoValue}
          onChange={e => onUniversoChange(e.target.value)}
          sx={selectSx}
          MenuProps={menuProps}
        >
          <MenuItem value="">Todos</MenuItem>
          {universos.map(u => (
            <MenuItem key={u.id} value={u.id}>
              {u.Nome}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {onSortChange && (
        <FormControl size="small">
          <InputLabel id="entity-filters-ordenar" sx={inputLabelSx}>
            Ordenar
          </InputLabel>
          <Select
            labelId="entity-filters-ordenar"
            label="Ordenar"
            value={sortValue}
            onChange={e => onSortChange(e.target.value)}
            sx={selectSx}
            MenuProps={menuProps}
          >
            {OPCOES_ORDENACAO_NOME.map(opcao => (
              <MenuItem key={opcao.value} value={opcao.value}>
                {opcao.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
};

EntityFilters.propTypes = {
  nomeValue: PropTypes.string.isRequired,
  onNomeChange: PropTypes.func.isRequired,
  extraFilters: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      onChange: PropTypes.func.isRequired,
      options: PropTypes.arrayOf(PropTypes.string).isRequired,
      allLabel: PropTypes.string,
    }),
  ),
  universos: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, Nome: PropTypes.string }),
  ),
  universoValue: PropTypes.string.isRequired,
  onUniversoChange: PropTypes.func.isRequired,
  sortValue: PropTypes.oneOf(['asc', 'desc']),
  onSortChange: PropTypes.func,
  sx: PropTypes.object,
  menuMaxHeight: PropTypes.number,
};

export default EntityFilters;
