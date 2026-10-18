-- Macro: dano_impacto
-- Calcula dano por queda, arremesso ou colisao e envia o resultado no chat.
-- A macro nao altera a ficha do personagem.

-- =========================
-- CONFIGURACOES PRINCIPAIS
-- =========================
local CD_BASE = 9
local METROS_POR_AUMENTO_OBSTACULO = 2
local AUMENTO_OBSTACULO = 1
-- Defesa calculada somente pela VIT.
-- Formula: teto((VIT / 250) * 16)
local BASE_DEFESA_VIT = 250
local FATOR_DEFESA_VIT = 16

-- Armadura e escudo usam o valor total rolado, sem nerf.

-- =========================
-- FUNCOES AUXILIARES
-- =========================
local function numero(pergunta, padrao)
    local resposta = inputQuery(pergunta)
    local valor = tonumber(resposta)

    if valor == nil then
        return padrao or 0
    end

    return valor
end

local function texto(pergunta, padrao)
    local resposta = inputQuery(pergunta)

    if resposta == nil or resposta == "" then
        return padrao or ""
    end

    return string.lower(resposta)
end

local function rolarDefesa(pergunta)
    local expressao = inputQuery(pergunta, "0")
    local resultado = rolarLocal(expressao)
    return resultado, expressao
end

local function rolarDados(quantidade, faces)
    local total = 0
    local resultados = {}

    for i = 1, quantidade do
        local resultado = math.random(1, faces)
        total = total + resultado
        table.insert(resultados, resultado)
    end

    return total, table.concat(resultados, ", ")
end

local function arredondarBaixo(valor)
    return math.floor(valor)
end

local function percentual(valor, porcentagem)
    return arredondarBaixo(valor * porcentagem)
end

-- =========================
-- ENTRADA DE DADOS
-- =========================
local nome = texto("Nome do personagem:", "Personagem")
local origem = texto("Origem: queda, arremesso ou colisao:", "queda")
local metros = numero("Altura ou distancia do impacto em metros:", 1)

if metros < 1 then
    metros = 1
end

local intensidade = "normal"
local multiplicadorImpacto = 1

if origem == "arremesso" or origem == "colisao" then
    intensidade = texto("Intensidade: fraco, normal, forte ou brutal:", "normal")

    if intensidade == "fraco" then
        multiplicadorImpacto = 0.75
    elseif intensidade == "forte" then
        multiplicadorImpacto = 1.25
    elseif intensidade == "brutal" then
        multiplicadorImpacto = 1.50
    else
        intensidade = "normal"
        multiplicadorImpacto = 1
    end
end

local opcoesSuperficies = {
    "[AMORTECIDA] Agua profunda",
    "[PERIGOSA] Agua rasa",
    "[AMORTECIDA] Areia fofa",
    "[AMORTECIDA] Lama",
    "[AMORTECIDA] Neve profunda",
    "[AMORTECIDA] Vegetacao densa",
    "[AMORTECIDA] Feno, colchao ou espuma",
    "[NORMAL] Terra ou barro",
    "[NORMAL] Madeira ou telhado",
    "[NORMAL] Chao comum",
    "[PESADA] Gelo solido",
    "[PESADA] Pedra ou concreto",
    "[PESADA] Metal",
    "[PESADA] Parede ou coluna",
    "[PESADA] Arvore grossa",
    "[PESADA] Entulho ou pedras soltas",
    "[CORTE] Vidro ou lamina",
    "[PERFURACAO] Espinhos ou estacas",
    "[ELEMENTAL] Fogo ou lava",
    "[ELEMENTAL] Acido ou energia",
    "[INSTAVEL] Superficie instavel"
}

-- O Firecast exibe estas opcoes em uma lista dentro de um popup.
local numeroSuperficie, textoSuperficie = choose(
    "Escolha a superficie do impacto:",
    opcoesSuperficies,
    10
)
local superficie = "chao comum"
local descricaoSuperficie = "impacto normal"
local tipoDanoSuperficie = "impacto"
local ajusteDadosSuperficie = 0
local facesSuperficie = nil

if numeroSuperficie == 1 then
    superficie = "agua profunda"
    descricaoSuperficie = "amortece muito (-2 dados)"
    ajusteDadosSuperficie = -2
elseif numeroSuperficie == 2 then
    superficie = "agua rasa"
    descricaoSuperficie = "impacto pesado (d8)"
    facesSuperficie = 8
elseif numeroSuperficie == 3 then
    superficie = "areia fofa"
    descricaoSuperficie = "amortece (-1 dado)"
    ajusteDadosSuperficie = -1
elseif numeroSuperficie == 4 then
    superficie = "lama"
    descricaoSuperficie = "amortece (-1 dado)"
    ajusteDadosSuperficie = -1
elseif numeroSuperficie == 5 then
    superficie = "neve profunda"
    descricaoSuperficie = "amortece (-1 dado)"
    ajusteDadosSuperficie = -1
elseif numeroSuperficie == 6 then
    superficie = "vegetacao densa"
    descricaoSuperficie = "amortece (-1 dado)"
    ajusteDadosSuperficie = -1
elseif numeroSuperficie == 7 then
    superficie = "feno, colchao ou espuma"
    descricaoSuperficie = "amortece muito (-2 dados)"
    ajusteDadosSuperficie = -2
elseif numeroSuperficie == 8 then
    superficie = "terra ou barro"
    descricaoSuperficie = "impacto normal (d6)"
elseif numeroSuperficie == 9 then
    superficie = "madeira ou telhado"
    descricaoSuperficie = "impacto normal (d6)"
elseif numeroSuperficie == 10 then
    superficie = "chao comum"
    descricaoSuperficie = "impacto normal (d6)"
elseif numeroSuperficie == 11 then
    superficie = "gelo solido"
    descricaoSuperficie = "impacto pesado (d8)"
    facesSuperficie = 8
elseif numeroSuperficie == 12 then
    superficie = "pedra ou concreto"
    descricaoSuperficie = "impacto pesado (d8)"
    facesSuperficie = 8
elseif numeroSuperficie == 13 then
    superficie = "metal"
    descricaoSuperficie = "impacto pesado (d8)"
    facesSuperficie = 8
elseif numeroSuperficie == 14 then
    superficie = "parede ou coluna"
    descricaoSuperficie = "impacto pesado (d8)"
    facesSuperficie = 8
elseif numeroSuperficie == 15 then
    superficie = "arvore grossa"
    descricaoSuperficie = "impacto pesado (d8)"
    facesSuperficie = 8
elseif numeroSuperficie == 16 then
    superficie = "entulho ou pedras soltas"
    descricaoSuperficie = "impacto pesado (d8)"
    facesSuperficie = 8
elseif numeroSuperficie == 17 then
    superficie = "vidro ou lamina"
    descricaoSuperficie = "cortante (d8)"
    tipoDanoSuperficie = "corte"
    facesSuperficie = 8
elseif numeroSuperficie == 18 then
    superficie = "espinhos ou estacas"
    descricaoSuperficie = "perfurante (d10)"
    tipoDanoSuperficie = "perfuracao"
    facesSuperficie = 10
elseif numeroSuperficie == 19 then
    superficie = "fogo ou lava"
    descricaoSuperficie = "impacto + dano elemental (d8)"
    facesSuperficie = 8
elseif numeroSuperficie == 20 then
    superficie = "acido ou energia"
    descricaoSuperficie = "impacto + dano elemental (d8)"
    facesSuperficie = 8
elseif numeroSuperficie == 21 then
    superficie = "superficie instavel"
    descricaoSuperficie = "amortece (-1 dado), risco de nova queda"
    ajusteDadosSuperficie = -1
else
    superficie = "chao comum"
    descricaoSuperficie = "impacto normal (d6)"
end

local rea = numero("Bonus de REA:", 0)
local sorte = numero("Sorte/SOR:", 0)
local vitalidade = numero("VIT:", 0)
local armadura, expressaoArmadura = rolarDefesa("Defesa da armadura - digite a rolagem do equipamento:")
local escudo, expressaoExtras = rolarDefesa("Extras (escudos, magias etc.) - digite a rolagem:")

-- =========================
-- OBSTACULO DE REACAO
-- =========================
-- O Obstaculo comeca em 9 e aumenta 1 ponto a cada 2 metros.
-- Exemplos: 1-2m = 9; 3-4m = 10; 5-6m = 11.
local obstaculo = CD_BASE + AUMENTO_OBSTACULO * arredondarBaixo((metros - 1) / METROS_POR_AUMENTO_OBSTACULO)

if obstaculo < CD_BASE then
    obstaculo = CD_BASE
end

local dadoReacao = math.random(1, 6)
local totalReacao = dadoReacao + rea + sorte
local margem = totalReacao - obstaculo

-- =========================
-- DANO BASE: FIXO + DADOS
-- Escala reforcada para que impactos relevantes atravessem defesas altas.
-- =========================
local alturaEquivalente = metros

if origem == "arremesso" or origem == "colisao" then
    alturaEquivalente = metros * multiplicadorImpacto
end

if alturaEquivalente < 1 then
    alturaEquivalente = 1
end

local danoFixo = 0
local quantidadeDados = 1
local faces = 4

if alturaEquivalente <= 2 then
    danoFixo = 8
    quantidadeDados = 1
    faces = 8
elseif alturaEquivalente <= 5 then
    danoFixo = 12
    quantidadeDados = 3
    faces = 6
elseif alturaEquivalente <= 10 then
    danoFixo = 25
    quantidadeDados = 5
    faces = 6
elseif alturaEquivalente <= 20 then
    danoFixo = 40
    quantidadeDados = 7
    faces = 6
elseif alturaEquivalente <= 30 then
    danoFixo = 65
    quantidadeDados = 9
    faces = 6
else
    danoFixo = 65 + 5 * arredondarBaixo((alturaEquivalente - 30) / 10)
    quantidadeDados = 9
    faces = 6
end

-- A superficie pode alterar a classe do dado ou a quantidade de dados.
if facesSuperficie ~= nil then
    faces = facesSuperficie
end

quantidadeDados = quantidadeDados + ajusteDadosSuperficie

if quantidadeDados < 1 then
    quantidadeDados = 1
end

local danoRolado, resultadosDano = rolarDados(quantidadeDados, faces)
local danoAntesSuperficie = danoFixo + danoRolado
local danoImpacto = danoAntesSuperficie

-- =========================
-- REDUCAO PELA REACAO
-- =========================
local multiplicadorReacao = 1.00
local resultadoReacao = "falha grave: sofreu 100% do dano"

if margem <= -3 then
    multiplicadorReacao = 1.00
    resultadoReacao = "falha grave: sofreu 100% do dano"
elseif margem < 0 then
    multiplicadorReacao = 1.25
    resultadoReacao = "falha leve: sofreu 125% do dano"
elseif margem > 5 then
    multiplicadorReacao = 0.70
    resultadoReacao = "sucesso alto: reduziu 30% do dano"
else
    multiplicadorReacao = 0.85
    resultadoReacao = "sucesso: reduziu 15% do dano"
end

local danoDepoisReacao = arredondarBaixo(danoImpacto * multiplicadorReacao)

-- Defesa Natural derivada somente da VIT.
local defesaNatural = math.ceil((vitalidade / BASE_DEFESA_VIT) * FATOR_DEFESA_VIT)
local reducaoDefesaNatural = defesaNatural
local reducaoArmadura = armadura
local reducaoEscudo = escudo
local reducoesDefensivas = reducaoDefesaNatural + reducaoArmadura + reducaoEscudo
local danoFinal = danoDepoisReacao - reducoesDefensivas

if danoFinal < 0 then
    danoFinal = 0
end

-- =========================
-- RESULTADO NO CHAT
-- =========================
local mensagem =
    "DANO DE IMPACTO - " .. nome .. "\n" ..
    ">>> DANO FINAL: " .. danoFinal .. " <<<\n" ..
    "------------------------------\n" ..
    "IMPACTO\n" ..
    "Tipo: " .. origem .. " | Distancia: " .. metros .. " m\n" ..
    "Superficie: " .. descricaoSuperficie .. "\n" ..
    "Altura equivalente: " .. string.format("%.1f", alturaEquivalente) .. " m\n\n" ..
    "CALCULO DO DANO\n" ..
    "Bruto: " .. danoFixo .. " + " .. quantidadeDados .. "d" .. faces ..
        " = " .. danoAntesSuperficie .. " [" .. resultadosDano .. "]\n" ..
    "Efeito: " .. descricaoSuperficie .. "\n" ..
    "Dano apos superficie: " .. danoImpacto .. "\n\n" ..
    "REACAO\n" ..
    "Rolagem: " .. totalReacao .. " | Obstaculo: " .. obstaculo .. "\n" ..
    "Resultado: " .. resultadoReacao .. "\n\n" ..
    "REDUCOES\n" ..
    "Defesa pela VIT: " .. defesaNatural .. "\n" ..
    "Defesa da armadura: " .. expressaoArmadura .. " = " .. reducaoArmadura .. "\n" ..
    "Extras: " .. expressaoExtras .. " = " .. reducaoEscudo .. "\n" ..
    "Total reduzido: " .. reducoesDefensivas .. "\n" ..
    "Multiplicador da reacao: " .. string.format("%.0f%%", multiplicadorReacao * 100)

enviar(mensagem)

-- Observacao: esta macro apenas envia o resultado no chat.
-- Ela nao modifica automaticamente os pontos de Saude.
-- Se o seu Firecast usar uma funcao especifica para rolagem/chat,
-- ela pode ser substituida na ultima linha sem alterar o calculo.

-- Fim da macro.

-- Testes rapidos de referencia:
-- 3 m, chao, REA 2, SOR 1: CD 9.
-- 6 m, chao, REA 2, SOR 1: CD 11.
-- 9 m, pedra, REA 3, SOR 2: CD 13.
-- 12 m, espinhos: dano rigido + 1d6 perfurante.
-- VIT 40 gera Defesa Natural 8.
-- Escala reforcada: 3-5 m = 10 + 2d6; 6-10 m = 20 + 3d6.
-- Fim.
