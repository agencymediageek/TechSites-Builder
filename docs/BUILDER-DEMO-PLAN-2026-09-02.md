# TechSites Builder — Plano de demonstração de 2 de setembro de 2026

**Atualizado em:** 28 de agosto de 2026  
**Status:** preparação de demonstração em staging; produção permanece bloqueada  
**Produtos apresentados:** TechSites Builder e Directory Builder

## 1. Objetivo da demonstração

Apresentar um fluxo real, curto e verificável no qual uma equipe:

1. entra no Hub;
2. cria ou abre um site;
3. edita conteúdo no Studio visual;
4. revisa o diff estruturado;
5. aprova uma revisão;
6. publica em um cenário de staging;
7. confirma o resultado ao vivo;
8. demonstra rollback sem perda do documento.

A demonstração não tenta provar que todo o roadmap de produção está concluído. O foco é provar o vertical slice comercial com segurança, rastreabilidade e infraestrutura sob controle próprio.

## 2. Posicionamento

- **TechSites Builder:** sistema operacional de criação, revisão e publicação de sites para equipes e agências.
- **Directory Builder:** produto white label para lançar diretórios locais e verticais com conteúdo, trials e evolução comercial.
- **BuilderDocument:** fonte de verdade. HTML, CSS, JavaScript, PWA, sitemap e demais arquivos são artefatos compilados.
- **IA governada:** a IA sugere operações estruturadas e validadas; não publica nem insere código livre.
- **Owner Editor:** edição restrita a campos e nós autorizados, separada do Studio profissional.

## 3. Decisões preservadas

- A hierarquia oficial é `Section → Container/Column → Block`.
- Alterações exigem autenticação, autorização, validação, diff, aprovação, auditoria e rollback.
- Templates e snapshots aprovados não podem ser substituídos por layouts genéricos sem autorização.
- “Cenário” é o termo oficial para testes e rollouts.
- E-commerce complexo, WooCommerce e áreas logadas não fazem parte do MVP da apresentação.
- O runtime sandbox permanece independente de AI Router, N8N e integrações externas.
- A publicação da demonstração usa o Worker `ts-builder-01-staging`, o KV `ts-builder-01-staging-kv` e a rota `staging.builder.techsites.ai/*`.
- Produção permanece bloqueada até aprovação formal.

## 4. Decisão de domínio para a apresentação

Manter `techsites.ai` como landing institucional. Usar `staging.builder.techsites.ai` para a demonstração validada e reservar `builder.techsites.ai` para a entrada comercial após o go-live.

**Motivo:** trocar o domínio raiz antes da apresentação não agrega valor ao fluxo demonstrado e cria risco desnecessário para a landing existente.

## 5. Escopo obrigatório da demo

### TechSites Builder

- Login e tenant descartável de demonstração.
- Site exemplo de locadora de veículos.
- Documento inicial persistido no banco.
- Edição visual de texto, imagem, botão e estrutura simples.
- Bloqueio de nós protegidos.
- Membership explícito por site: owner, admin ou editor autorizado.
- Sugestão de IA convertida em operações estruturadas.
- Salvamento com lock de concorrência e idempotência.
- Aprovação e publicação no cenário de staging.
- Live check e rollback para a revisão anterior.

### Directory Builder

- Demonstrar o `cwb.site` preservando o snapshot aprovado.
- Mostrar listings, trials e páginas de detalhe já funcionais.
- Não republicar `cwb.site` durante a preparação sem necessidade e aprovação explícita.
- Usar um ambiente ou tenant descartável para qualquer teste destrutivo.

## 6. Fora do escopo desta apresentação

- conclusão integral do Studio;
- bundle completo de produção com todos os tipos de asset;
- workflow N8N definitivo e versionado;
- publicação concorrente com lock distribuído;
- deploy autônomo completo da VPS;
- observabilidade, alertas e disaster recovery completos;
- migração de todos os produtos antigos para o novo Builder.

Esses itens permanecem no roadmap pós-demo e não devem ser apresentados como concluídos.

## 7. Cronograma de seis dias

### Sexta-feira, 28 de agosto — segurança e documentação

- [x] Confirmar infraestrutura isolada de staging.
- [x] Adicionar membership explícito por site e remover acesso global de editor.
- [x] Bloquear operações em nós protegidos e seus descendentes.
- [x] Validar migration, testes, build e reinício local.
- [x] Consolidar este plano no repositório e no Drive.

### Sábado, 29 de agosto — locadora e Studio

- [x] Fazer o próprio Builder sugerir nome, monograma/logo e paleta por ramo.
- [x] Adicionar o ramo “Automotivo & Locadora” ao onboarding.
- [x] Remover publicação automática: novos sites permanecem em rascunho até revisão.
- [ ] Criar tenant/site descartável.
- [ ] Garantir criação, abertura e edição no Studio sem etapas simuladas.
- [ ] Revisar o tratamento de falha da geração por IA no fluxo de criação.

### Domingo, 30 de agosto — publicação e Directory

- [ ] Publicar a locadora no cenário de staging.
- [ ] Validar live check, segunda publicação e rollback.
- [ ] Validar `cwb.site` sem alterar o snapshot aprovado.
- [ ] Registrar evidências visuais dos dois produtos.

### Segunda-feira, 31 de agosto — ensaio ponta a ponta

- [ ] Executar o roteiro completo com usuário novo.
- [ ] Confirmar isolamento entre dois sites/equipes.
- [ ] Testar falhas previsíveis: conflito de edição, IA indisponível e publicação repetida.
- [ ] Fixar conteúdo e roteiro narrativo.

### Terça-feira, 1º de setembro — congelamento

- [ ] Corrigir somente bloqueadores críticos.
- [ ] Fazer backup dos documentos, banco e artefatos de staging.
- [ ] Preparar um vídeo curto de contingência ou capturas do fluxo.
- [ ] Congelar código, dados e conteúdo da demo.

### Quarta-feira, 2 de setembro — apresentação

- [ ] Rodar smoke check antes da reunião.
- [ ] Executar o roteiro principal em staging.
- [ ] Usar evidência gravada apenas se houver falha externa.
- [ ] Não alterar DNS, Workers ou banco durante a apresentação.

## 8. Critérios de go/no-go

### Go

- login e site de demonstração acessíveis;
- edição e salvamento persistem após recarregar;
- usuário sem membership não acessa site alheio;
- nó bloqueado não pode ser alterado por operação direta ou por IA;
- publicação é idempotente;
- live check confirma o checksum esperado;
- rollback restaura exatamente a publicação anterior;
- `cwb.site` continua visualmente intacto.

### No-go

- qualquer vazamento entre tenants;
- alteração de snapshot aprovado;
- necessidade de usar credencial Cloudflare compartilhada;
- publicação dependente de recurso não ensaiado;
- ausência de rollback verificável;
- dados ou segredos expostos em logs, documentação ou UI.

## 9. Estado técnico em 28 de agosto

- Fundação técnica vertical: aproximadamente 81%.
- Roadmap completo ponderado: aproximadamente 48%.
- Prontidão para produção: aproximadamente 25%.
- Edge staging, canário, replay idempotente, segunda publicação e rollback: comprovados.
- Banco reproduzível, runtime VPS e CI do sandbox: comprovados.
- Membership por site e proteção de nós bloqueados: implementados e validados em desenvolvimento.
- Studio visual, bundle completo, automação E2E, observabilidade e recuperação externa: ainda incompletos.

## 10. Decisão de identidade da demonstração

Nome, monograma/logo e paleta da locadora não serão definidos fora do produto. O próprio Builder deverá sugerir o nome, aplicar uma paleta por ramo de atividade, aceitar upload de logo e persistir a identidade no primeiro `BuilderDocument`.

O próximo passo operacional é criar um tenant descartável e executar o fluxo autenticado completo sem promover o site para produção.