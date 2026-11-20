import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import useConfirmacao from 'components/ConfirmDialog/useConfirmacao';
import {
  CATEGORIAS_TIPO_VINCULO,
  TIPOS_VINCULO_INICIAIS,
  derivarRelacaoInversa,
  validarReferenciaVinculo,
} from './vinculosUtils';
import { normalizeEntityTypeName } from './notaUtils';

const vazio = {
  destino: null,
  tipo: null,
  novoTipo: '',
  inversa: '',
  categoria: 'Outro',
  simetrico: false,
};

const VinculosPanel = ({
  origemId,
  vinculos = [],
  tipos = [],
  destinos = [],
  universoId,
  onAdicionar,
  onAtualizar,
  onRemover,
  onCriarTipo,
  onAtualizarTipo,
  notifyError,
}) => {
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formulario, setFormulario] = useState(vazio);
  const [tiposAberto, setTiposAberto] = useState(false);
  const [tipoEditando, setTipoEditando] = useState(null);
  const [confirmar, dialogoConfirmacao] = useConfirmacao();

  const opcoesTipo = useMemo(() => {
    const nomes = new Map();
    [...TIPOS_VINCULO_INICIAIS, ...tipos].forEach(tipo => {
      const name = tipo?.name || tipo?.nome || tipo?.title;
      if (!name) return;
      nomes.set(normalizeEntityTypeName(name), {
        ...tipo,
        name,
      });
    });
    return [...nomes.values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR'),
    );
  }, [tipos]);

  const abrirNovo = () => {
    setEditando(null);
    setFormulario(vazio);
    setDialogoAberto(true);
  };

  const abrirEdicao = vinculo => {
    const tipo =
      opcoesTipo.find(item => item.id === vinculo.tipoId) ||
      opcoesTipo.find(
        item =>
          normalizeEntityTypeName(item.name) ===
          normalizeEntityTypeName(vinculo.tipoNome),
      ) ||
      null;
    const destino =
      destinos.find(
        item =>
          item.destinoColecao === vinculo.destinoColecao &&
          item.destinoId === vinculo.destinoId,
      ) || null;
    setEditando(vinculo);
    setFormulario({
      destino,
      tipo,
      novoTipo: '',
      inversa: tipo?.inverseName || '',
      categoria: tipo?.category || tipo?.categoria || 'Outro',
      simetrico: Boolean(tipo?.symmetric),
    });
    setDialogoAberto(true);
  };

  const concluir = async () => {
    if (
      !formulario.destino ||
      (!formulario.tipo && !formulario.novoTipo.trim())
    ) {
      notifyError('Selecione uma ficha e um tipo de vínculo.');
      return;
    }

    const destino = formulario.destino;
    const validacao = validarReferenciaVinculo({
      origem: origemId,
      destino: destino.destinoId,
      universoOrigem: universoId,
      universoDestino: destino.universoId,
    });
    if (!validacao.ok) {
      notifyError(
        validacao.erro === 'AUTORRELACIONAMENTO'
          ? 'Uma entidade não pode vincular a si mesma.'
          : 'A ficha selecionada pertence a outro universo.',
      );
      return;
    }

    let tipo = formulario.tipo;
    if (!tipo) {
      const criado = await onCriarTipo({
        name: formulario.novoTipo.trim(),
        inverseName: formulario.inversa.trim() || formulario.novoTipo.trim(),
        category: formulario.categoria,
        symmetric: formulario.simetrico,
      });
      tipo = criado;
      if (!tipo) return;
    }

    const dados = {
      origemId,
      origemColecao: 'rmNotas',
      destinoId: destino.destinoId,
      destinoColecao: destino.destinoColecao,
      origemPersonagemId: destino.origemPersonagemId || null,
      destinoNome: destino.nome,
      destinoTipo: destino.tipo,
      destinoImagem: destino.imagem || null,
      destinoUniversoId: destino.universoId || universoId,
      tipoId: tipo.id || null,
      tipoNome: tipo.name,
      tipoInversa: derivarRelacaoInversa(tipo),
      tipoCategoria: tipo.category || tipo.categoria || 'Outro',
      tipoSimetrico: Boolean(tipo.symmetric),
    };

    if (editando) await onAtualizar(editando.id, dados);
    else await onAdicionar(dados);
    setDialogoAberto(false);
  };

  const remover = async vinculo => {
    if (
      !(await confirmar({
        titulo: 'Remover vínculo?',
        mensagem: `Remover o vínculo com ${vinculo.destinoNome || 'esta ficha'}?`,
        consequencias: ['A ficha vinculada não será excluída.'],
        confirmarTexto: 'Remover vínculo',
      }))
    )
      return;
    await onRemover(vinculo.id);
  };

  const salvarTipoEdicao = async () => {
    if (!tipoEditando) return;
    await onAtualizarTipo(tipoEditando.id, {
      name: tipoEditando.name,
      inverseName: tipoEditando.inverseName,
      category: tipoEditando.category,
      symmetric: Boolean(tipoEditando.symmetric),
    });
    setTiposAberto(false);
  };

  return (
    <>
      <Accordion
        defaultExpanded
        disableGutters
        elevation={0}
        sx={{
          borderRadius: '14px !important',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15,18,26,0.96)',
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkOutlinedIcon
              fontSize="small"
              sx={{ color: 'var(--text-secondary)' }}
            />
            <Typography sx={{ fontWeight: 800 }}>Vínculos</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', gap: 1, mb: vinculos.length ? 1 : 0 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddOutlinedIcon />}
              onClick={abrirNovo}
              sx={{ textTransform: 'none' }}
            >
              Adicionar vínculo
            </Button>
            {tipos.length > 0 && (
              <Button
                size="small"
                onClick={() => setTiposAberto(true)}
                sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
              >
                Tipos
              </Button>
            )}
          </Box>

          {vinculos.length > 0 && (
            <Box
              sx={{
                maxHeight: 240,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.75,
              }}
            >
              {vinculos.map(vinculo => (
                <Box
                  key={vinculo.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '40px minmax(0,1fr) auto',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                  }}
                >
                  {vinculo.destinoImagem ? (
                    <Box
                      component="img"
                      src={vinculo.destinoImagem}
                      alt=""
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <LinkOutlinedIcon fontSize="small" />
                    </Box>
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}
                    >
                      {vinculo.destinoNome}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'var(--text-secondary)' }}
                    >
                      {vinculo.tipoNome} · {vinculo.tipoCategoria}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex' }}>
                    <IconButton
                      aria-label="Editar vínculo"
                      size="small"
                      onClick={() => abrirEdicao(vinculo)}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      aria-label="Remover vínculo"
                      size="small"
                      onClick={() => remover(vinculo)}
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      <Dialog
        open={dialogoAberto}
        onClose={() => setDialogoAberto(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editando ? 'Editar vínculo' : 'Adicionar vínculo'}
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            pt: '12px !important',
          }}
        >
          <Autocomplete
            options={destinos}
            value={formulario.destino}
            getOptionLabel={opcao => opcao?.nome || ''}
            isOptionEqualToValue={(opcao, valor) => opcao.key === valor.key}
            onChange={(_event, destino) =>
              setFormulario(atual => ({ ...atual, destino }))
            }
            renderOption={(props, opcao) => (
              <li {...props} key={opcao.key}>
                {opcao.imagem && (
                  <Box
                    component="img"
                    src={opcao.imagem}
                    alt=""
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      mr: 1,
                    }}
                  />
                )}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 750 }}>
                    {opcao.nome}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'var(--text-secondary)' }}
                  >
                    {opcao.tipo}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={params => (
              <TextField {...params} label="Selecionar ficha" fullWidth />
            )}
          />

          <Autocomplete
            freeSolo
            options={opcoesTipo}
            value={formulario.tipo}
            getOptionLabel={opcao =>
              typeof opcao === 'string' ? opcao : opcao?.name || ''
            }
            filterOptions={(options, params) => {
              const filtered = createFilterOptions()(options, params);
              const typed = params.inputValue.trim();
              if (
                typed &&
                !options.some(
                  option =>
                    normalizeEntityTypeName(option.name) ===
                    normalizeEntityTypeName(typed),
                )
              ) {
                filtered.push({
                  inputValue: typed,
                  name: `+ Criar tipo "${typed}"`,
                });
              }
              return filtered;
            }}
            onChange={(_event, novoTipo) => {
              if (typeof novoTipo === 'object' && novoTipo?.inputValue) {
                setFormulario(atual => ({
                  ...atual,
                  tipo: null,
                  novoTipo: novoTipo.inputValue,
                  inversa: '',
                }));
              } else {
                setFormulario(atual => ({
                  ...atual,
                  tipo: typeof novoTipo === 'object' ? novoTipo : null,
                  novoTipo: typeof novoTipo === 'string' ? novoTipo : '',
                  inversa:
                    typeof novoTipo === 'object'
                      ? novoTipo.inverseName || ''
                      : '',
                  categoria:
                    typeof novoTipo === 'object'
                      ? novoTipo.category || novoTipo.categoria || 'Outro'
                      : atual.categoria,
                  simetrico:
                    typeof novoTipo === 'object'
                      ? Boolean(novoTipo.symmetric)
                      : atual.simetrico,
                }));
              }
            }}
            renderOption={(props, opcao) => (
              <li {...props} key={opcao.id || opcao.inputValue || opcao.name}>
                {opcao.name}
              </li>
            )}
            renderInput={params => (
              <TextField {...params} label="Tipo de vínculo" fullWidth />
            )}
          />

          {formulario.novoTipo && (
            <>
              <TextField
                label="Nome do vínculo"
                value={formulario.novoTipo}
                onChange={event =>
                  setFormulario(atual => ({
                    ...atual,
                    novoTipo: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Nome da relação inversa"
                value={formulario.inversa}
                onChange={event =>
                  setFormulario(atual => ({
                    ...atual,
                    inversa: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                select
                label="Categoria"
                value={formulario.categoria}
                onChange={event =>
                  setFormulario(atual => ({
                    ...atual,
                    categoria: event.target.value,
                  }))
                }
                fullWidth
              >
                {CATEGORIAS_TIPO_VINCULO.map(categoria => (
                  <MenuItem key={categoria} value={categoria}>
                    {categoria}
                  </MenuItem>
                ))}
              </TextField>
              <Chip
                label={formulario.simetrico ? 'Simétrico' : 'Direcionado'}
                onClick={() =>
                  setFormulario(atual => ({
                    ...atual,
                    simetrico: !atual.simetrico,
                  }))
                }
                variant="outlined"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAberto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={concluir}>
            {editando ? 'Salvar vínculo' : 'Adicionar vínculo'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={tiposAberto}
        onClose={() => setTiposAberto(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Tipos de vínculo</DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            pt: '12px !important',
          }}
        >
          {tipos
            .filter(tipo => tipo.mestreId === undefined || tipo.mestreId)
            .map(tipo => (
              <Box
                key={tipo.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1fr) auto',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 750 }}>
                  {tipo.name}
                </Typography>
                <IconButton
                  aria-label={`Editar tipo ${tipo.name}`}
                  onClick={() => setTipoEditando({ ...tipo })}
                >
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          {tipoEditando && (
            <>
              <TextField
                label="Nome"
                value={tipoEditando.name}
                onChange={event =>
                  setTipoEditando(atual => ({
                    ...atual,
                    name: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                label="Relação inversa"
                value={tipoEditando.inverseName || ''}
                onChange={event =>
                  setTipoEditando(atual => ({
                    ...atual,
                    inverseName: event.target.value,
                  }))
                }
                fullWidth
              />
              <TextField
                select
                label="Categoria"
                value={
                  tipoEditando.category || tipoEditando.categoria || 'Outro'
                }
                onChange={event =>
                  setTipoEditando(atual => ({
                    ...atual,
                    category: event.target.value,
                  }))
                }
                fullWidth
              >
                {CATEGORIAS_TIPO_VINCULO.map(categoria => (
                  <MenuItem key={categoria} value={categoria}>
                    {categoria}
                  </MenuItem>
                ))}
              </TextField>
              <Chip
                label={tipoEditando.symmetric ? 'Simétrico' : 'Direcionado'}
                onClick={() =>
                  setTipoEditando(atual => ({
                    ...atual,
                    symmetric: !atual.symmetric,
                  }))
                }
                variant="outlined"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setTipoEditando(null);
              setTiposAberto(false);
            }}
          >
            Fechar
          </Button>
          {tipoEditando && (
            <Button variant="contained" onClick={salvarTipoEdicao}>
              Salvar tipo
            </Button>
          )}
        </DialogActions>
      </Dialog>
      {dialogoConfirmacao}
    </>
  );
};

VinculosPanel.propTypes = {
  origemId: PropTypes.string,
  vinculos: PropTypes.array,
  tipos: PropTypes.array,
  destinos: PropTypes.array,
  universoId: PropTypes.string,
  onAdicionar: PropTypes.func.isRequired,
  onAtualizar: PropTypes.func.isRequired,
  onRemover: PropTypes.func.isRequired,
  onCriarTipo: PropTypes.func.isRequired,
  onAtualizarTipo: PropTypes.func.isRequired,
  notifyError: PropTypes.func.isRequired,
};

export default VinculosPanel;
