-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: devpoint_agenda_online:3306
-- Tempo de geração: 18/04/2026 às 16:24
-- Versão do servidor: 9.6.0
-- Versão do PHP: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `agenda_online`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `agendamentos`
--

CREATE TABLE `agendamentos` (
  `id` bigint UNSIGNED NOT NULL,
  `agenda_id` bigint UNSIGNED NOT NULL,
  `cliente_id` bigint UNSIGNED NOT NULL,
  `servico_id` bigint UNSIGNED NOT NULL,
  `inicio_em` datetime(3) NOT NULL,
  `fim_em` datetime(3) NOT NULL,
  `situacao` enum('pendente','confirmado','cancelado','concluido','nao_compareceu') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'confirmado',
  `mensagem_cliente` text COLLATE utf8mb4_unicode_ci,
  `observacao_interna` text COLLATE utf8mb4_unicode_ci,
  `criado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `agendas`
--

CREATE TABLE `agendas` (
  `id` bigint UNSIGNED NOT NULL,
  `nome` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug_agenda` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `criado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `clientes`
--

CREATE TABLE `clientes` (
  `id` bigint UNSIGNED NOT NULL,
  `agenda_id` bigint UNSIGNED NOT NULL,
  `nome_completo` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `observacoes` text COLLATE utf8mb4_unicode_ci,
  `criado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `definicoes_campos_coleta`
--

CREATE TABLE `definicoes_campos_coleta` (
  `id` bigint UNSIGNED NOT NULL,
  `agenda_id` bigint UNSIGNED NOT NULL,
  `chave_campo` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rotulo` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo_campo` enum('texto','texto_longo','telefone','email','numero','selecao') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'texto',
  `opcoes_json` json DEFAULT NULL,
  `obrigatorio` tinyint(1) NOT NULL DEFAULT '1',
  `ordem` int NOT NULL DEFAULT '0',
  `criado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `disponibilidade_semanal`
--

CREATE TABLE `disponibilidade_semanal` (
  `id` bigint UNSIGNED NOT NULL,
  `agenda_id` bigint UNSIGNED NOT NULL,
  `dia_semana` tinyint UNSIGNED NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fim` time NOT NULL,
  `criado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `excecoes_calendario`
--

CREATE TABLE `excecoes_calendario` (
  `id` bigint UNSIGNED NOT NULL,
  `agenda_id` bigint UNSIGNED NOT NULL,
  `data_excecao` date NOT NULL,
  `fechado_o_dia` tinyint(1) NOT NULL DEFAULT '1',
  `hora_inicio` time DEFAULT NULL,
  `hora_fim` time DEFAULT NULL,
  `observacao` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `respostas_campos_agendamento`
--

CREATE TABLE `respostas_campos_agendamento` (
  `id` bigint UNSIGNED NOT NULL,
  `agendamento_id` bigint UNSIGNED NOT NULL,
  `definicao_campo_id` bigint UNSIGNED NOT NULL,
  `valor_texto` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `criado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `servicos`
--

CREATE TABLE `servicos` (
  `id` bigint UNSIGNED NOT NULL,
  `agenda_id` bigint UNSIGNED NOT NULL,
  `nome` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `duracao_minutos` int UNSIGNED NOT NULL,
  `preco` int UNSIGNED DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `ordem` int NOT NULL DEFAULT '0',
  `criado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` bigint UNSIGNED NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario_agenda`
--

CREATE TABLE `usuario_agenda` (
  `id` bigint UNSIGNED NOT NULL,
  `usuario_id` bigint UNSIGNED NOT NULL,
  `agenda_id` bigint UNSIGNED NOT NULL,
  `papel` enum('proprietario','colaborador') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'proprietario',
  `criado_em` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `agendamentos`
--
ALTER TABLE `agendamentos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_agendamentos_agenda_inicio` (`agenda_id`,`inicio_em`),
  ADD KEY `ix_agendamentos_cliente` (`cliente_id`),
  ADD KEY `ix_agendamentos_servico` (`servico_id`),
  ADD KEY `ix_agendamentos_situacao` (`agenda_id`,`situacao`);

--
-- Índices de tabela `agendas`
--
ALTER TABLE `agendas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_agendas_slug` (`slug_agenda`),
  ADD KEY `ix_agendas_ativo` (`ativo`);

--
-- Índices de tabela `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cliente_email_por_agenda` (`agenda_id`,`email`),
  ADD KEY `ix_clientes_agenda` (`agenda_id`);

--
-- Índices de tabela `definicoes_campos_coleta`
--
ALTER TABLE `definicoes_campos_coleta`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_campo_coleta` (`agenda_id`,`chave_campo`),
  ADD KEY `ix_campos_coleta_agenda` (`agenda_id`);

--
-- Índices de tabela `disponibilidade_semanal`
--
ALTER TABLE `disponibilidade_semanal`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_disp_semana_agenda_dia` (`agenda_id`,`dia_semana`);

--
-- Índices de tabela `excecoes_calendario`
--
ALTER TABLE `excecoes_calendario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_excecao_janela` (`agenda_id`,`data_excecao`,`fechado_o_dia`,`hora_inicio`,`hora_fim`),
  ADD KEY `ix_excecoes_agenda_data` (`agenda_id`,`data_excecao`);

--
-- Índices de tabela `respostas_campos_agendamento`
--
ALTER TABLE `respostas_campos_agendamento`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_resposta_por_campo` (`agendamento_id`,`definicao_campo_id`),
  ADD KEY `ix_respostas_agendamento` (`agendamento_id`),
  ADD KEY `fk_respostas_definicao` (`definicao_campo_id`);

--
-- Índices de tabela `servicos`
--
ALTER TABLE `servicos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_servicos_agenda` (`agenda_id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuarios_email` (`email`);

--
-- Índices de tabela `usuario_agenda`
--
ALTER TABLE `usuario_agenda`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuario_agenda` (`usuario_id`,`agenda_id`),
  ADD KEY `ix_usuario_agenda_agenda` (`agenda_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `agendamentos`
--
ALTER TABLE `agendamentos`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `agendas`
--
ALTER TABLE `agendas`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `definicoes_campos_coleta`
--
ALTER TABLE `definicoes_campos_coleta`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `disponibilidade_semanal`
--
ALTER TABLE `disponibilidade_semanal`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `excecoes_calendario`
--
ALTER TABLE `excecoes_calendario`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `respostas_campos_agendamento`
--
ALTER TABLE `respostas_campos_agendamento`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `servicos`
--
ALTER TABLE `servicos`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuario_agenda`
--
ALTER TABLE `usuario_agenda`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `agendamentos`
--
ALTER TABLE `agendamentos`
  ADD CONSTRAINT `fk_agendamentos_agenda` FOREIGN KEY (`agenda_id`) REFERENCES `agendas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_agendamentos_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_agendamentos_servico` FOREIGN KEY (`servico_id`) REFERENCES `servicos` (`id`) ON DELETE RESTRICT;

--
-- Restrições para tabelas `clientes`
--
ALTER TABLE `clientes`
  ADD CONSTRAINT `fk_clientes_agenda` FOREIGN KEY (`agenda_id`) REFERENCES `agendas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `definicoes_campos_coleta`
--
ALTER TABLE `definicoes_campos_coleta`
  ADD CONSTRAINT `fk_campos_coleta_agenda` FOREIGN KEY (`agenda_id`) REFERENCES `agendas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `disponibilidade_semanal`
--
ALTER TABLE `disponibilidade_semanal`
  ADD CONSTRAINT `fk_disp_semana_agenda` FOREIGN KEY (`agenda_id`) REFERENCES `agendas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `excecoes_calendario`
--
ALTER TABLE `excecoes_calendario`
  ADD CONSTRAINT `fk_excecoes_agenda` FOREIGN KEY (`agenda_id`) REFERENCES `agendas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `respostas_campos_agendamento`
--
ALTER TABLE `respostas_campos_agendamento`
  ADD CONSTRAINT `fk_respostas_agendamento` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamentos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_respostas_definicao` FOREIGN KEY (`definicao_campo_id`) REFERENCES `definicoes_campos_coleta` (`id`) ON DELETE RESTRICT;

--
-- Restrições para tabelas `servicos`
--
ALTER TABLE `servicos`
  ADD CONSTRAINT `fk_servicos_agenda` FOREIGN KEY (`agenda_id`) REFERENCES `agendas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `usuario_agenda`
--
ALTER TABLE `usuario_agenda`
  ADD CONSTRAINT `fk_usuario_agenda_agenda` FOREIGN KEY (`agenda_id`) REFERENCES `agendas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_usuario_agenda_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
