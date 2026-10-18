import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { isUrlImagemValida } from 'common/utils/chat';
import { TIPOS_TOKEN, TOKEN_NOME_MAX } from 'common/utils/grid';
import { OPCOES_TAMANHO_TOKEN } from './gridMestre';

const ABAS = [
  { valor: TIPOS_TOKEN.JOGADOR, rotulo: 'Jogadores', fonte: 'jogadores' },
  { valor: TIPOS_TOKEN.NPC, rotulo: 'NPCs', fonte: 'npcs' },
  { valor: TIPOS_TOKEN.CRIATURA, rotulo: 'Criaturas', fonte: 'criaturas' },
  { valor: TIPOS_TOKEN.AVULSO, rotulo: 'Avulso', fonte: null },
];

const VAZIO = {
  jogadores: 'Nenhum personagem jogável vinculado a esta campanha.',
  npcs: 'Nenhum NPC vinculado a esta campanha.',
  criaturas: 'Nenhuma Criatura vinculada a esta campanha.',
};

/**
 * "Adicionar token" do Grid: a partir de um personagem jogável (o dono da
 * ficha já vira dono do token), de um NPC/Criatura da mesa ou avulso (nome +
 * link de imagem). O diálogo fica aberto para adicionar vários seguidos; quem
 * monta escolhe a célula (primeira livre), grava e devolve se deu certo.
 */
const AdicionarTokenDialog = ({ open, onClose, fontes, onAdicionar }) => {
  const [aba, setAba] = useState(TIPOS_TOKEN.JOGADOR);
  const [tamanho, setTamanho] = useState(1);
  const [oculto, setOculto] = useState(false);
  const [avulso, setAvulso] = useState({ nome: '', imagemUrl: '' });

  const abaAtual = ABAS.find(item => item.valor === aba);
  const lista = abaAtual.fonte ? fontes[abaAtual.fonte] : [];

  const adicionar = origem =>
    onAdicionar({
      nome: origem.label,
      imagemUrl: origem.avatar ?? null,
      tipo: aba,
      refId: origem.refId ?? null,
      donos: aba === TIPOS_TOKEN.JOGADOR && origem.uid ? [origem.uid] : [],
      tamanho,
      oculto,
    });

  const urlAvulso = avulso.imagemUrl.trim();
  const erroAvulso =
    urlAvulso && !isUrlImagemValida(urlAvulso)
      ? 'Informe um link https:// de imagem válido (ou deixe em branco).'
      : null;

  const adicionarAvulso = async () => {
    const adicionado = await onAdicionar({
      nome: avulso.nome,
      imagemUrl: urlAvulso || null,
      tipo: TIPOS_TOKEN.AVULSO,
      refId: null,
      donos: [],
      tamanho,
      oculto,
    });
    if (adicionado) setAvulso({ nome: '', imagemUrl: '' });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Adicionar token</DialogTitle>
      <DialogContent>
        <Tabs
          value={aba}
          onChange={(_event, valor) => setAba(valor)}
          variant="scrollable"
          sx={{ mb: 2 }}
        >
          {ABAS.map(item => (
            <Tab key={item.valor} value={item.valor} label={item.rotulo} />
          ))}
        </Tabs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <TextField
            select
            size="small"
            label="Tamanho"
            value={tamanho}
            onChange={event => setTamanho(event.target.value)}
            sx={{ minWidth: 120 }}
          >
            {OPCOES_TAMANHO_TOKEN.map(opcao => (
              <MenuItem key={opcao.value} value={opcao.value}>
                {opcao.label}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={oculto}
                onChange={event => setOculto(event.target.checked)}
              />
            }
            label="Entrar oculto"
          />
        </Box>

        {abaAtual.fonte ? (
          <List dense aria-label={abaAtual.rotulo}>
            {lista.length === 0 && (
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)', py: 2 }}
              >
                {VAZIO[abaAtual.fonte]}
              </Typography>
            )}
            {lista.map(origem => (
              <ListItem
                key={origem.id}
                secondaryAction={
                  <Button
                    size="small"
                    aria-label={`Adicionar ${origem.label}`}
                    onClick={() => adicionar(origem)}
                  >
                    Adicionar
                  </Button>
                }
              >
                <ListItemAvatar>
                  <Avatar src={origem.avatar || undefined} alt="">
                    {origem.label[0]?.toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={origem.label} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              size="small"
              label="Nome do token"
              value={avulso.nome}
              onChange={event =>
                setAvulso(atual => ({ ...atual, nome: event.target.value }))
              }
              slotProps={{ htmlInput: { maxLength: TOKEN_NOME_MAX } }}
            />
            <TextField
              size="small"
              label="Imagem (link https://)"
              value={avulso.imagemUrl}
              onChange={event =>
                setAvulso(atual => ({
                  ...atual,
                  imagemUrl: event.target.value,
                }))
              }
              error={Boolean(erroAvulso)}
              helperText={erroAvulso ?? ' '}
            />
            <Box>
              <Button
                variant="contained"
                onClick={adicionarAvulso}
                disabled={!avulso.nome.trim() || Boolean(erroAvulso)}
              >
                Adicionar avulso
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

const origemShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  refId: PropTypes.string,
  label: PropTypes.string.isRequired,
  avatar: PropTypes.string,
  uid: PropTypes.string,
});

AdicionarTokenDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  fontes: PropTypes.shape({
    jogadores: PropTypes.arrayOf(origemShape).isRequired,
    npcs: PropTypes.arrayOf(origemShape).isRequired,
    criaturas: PropTypes.arrayOf(origemShape).isRequired,
  }).isRequired,
  onAdicionar: PropTypes.func.isRequired,
};

export default AdicionarTokenDialog;
