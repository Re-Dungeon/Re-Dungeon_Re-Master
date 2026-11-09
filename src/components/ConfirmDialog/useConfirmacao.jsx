import React, { useCallback, useState } from 'react';

import ConfirmDialog from './ConfirmDialog';

// Confirmação como promessa: `const [confirmar, dialogo] = useConfirmacao()`;
// renderize `{dialogo}` e use `if (!(await confirmar({ titulo, ... }))) return;`.
// As opções são as props do ConfirmDialog (titulo, mensagem, consequencias,
// confirmarTexto, exigirDigitar). Cópia compartilhada (scripts/check-shared.mjs).
const useConfirmacao = () => {
  const [pedido, setPedido] = useState(null);

  const confirmar = useCallback(
    opcoes => new Promise(resolve => setPedido({ opcoes, resolve })),
    [],
  );

  const responder = resposta => {
    pedido?.resolve(resposta);
    setPedido(null);
  };

  const dialogo = (
    <ConfirmDialog
      {...(pedido?.opcoes ?? {})}
      open={Boolean(pedido)}
      titulo={pedido?.opcoes?.titulo ?? ''}
      onConfirmar={() => responder(true)}
      onCancelar={() => responder(false)}
    />
  );

  return [confirmar, dialogo];
};

export default useConfirmacao;
