# aws-auto-scale-caseiro

Script Node.js para trocar o tipo (tamanho) de uma instância EC2 da AWS na região `sa-east-1`.

Fluxo executado:

1. Para a instância.
2. Aguarda ela ficar `stopped` (verifica a cada 30s, até 10 tentativas).
3. Altera o tipo da instância.
4. Aguarda 30s e inicia a instância.
5. Aguarda ela ficar `running` (mesma regra de 30s / 10 tentativas).

Se alguma etapa estourar as tentativas, o script registra o erro e encerra com código `1`.

## Requisitos

- Node.js 18+ (ES Modules)
- Credenciais AWS configuradas no ambiente (`~/.aws/credentials`, variáveis `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`, ou role da instância) com permissão para:
  - `ec2:DescribeInstances`
  - `ec2:StopInstances`
  - `ec2:StartInstances`
  - `ec2:ModifyInstanceAttribute`
- Permissão de escrita em `/var/log/` (o log é gravado em `/var/log/auto-scale.log`)

## Instalação

```bash
npm install
```

## Uso

```bash
node main.js <instance-id> <tipo-da-instancia>
```

Exemplo:

```bash
node main.js i-0123456789abcdef0 c5n.2xlarge
```

Também funciona via npm:

```bash
npm run dev -- i-0123456789abcdef0 c5n.2xlarge
```

### Tipos de instância aceitos

| Argumento      |
|----------------|
| `t3a.small`    |
| `c5n.xlarge`   |
| `c5n.2xlarge`  |
| `c5n.4xlarge`  |

Qualquer outro valor encerra o script com `⚠️ Tipo de instancia inválida`.
Para liberar novos tipos, adicione-os ao `instanceTypeEnum` em `main.js`.

## Logs

Os resultados não são enviados para nenhum serviço externo; tudo é apenas logado:

- No console (stdout).
- No arquivo `/var/log/auto-scale.log`, com data/hora no fuso `America/Sao_Paulo`.

Acompanhe com:

```bash
tail -f /var/log/auto-scale.log
```

Se o usuário que roda o script não puder escrever em `/var/log`, crie o arquivo antes:

```bash
sudo touch /var/log/auto-scale.log && sudo chown $USER /var/log/auto-scale.log
```

## Atenção

- A instância **fica indisponível** durante todo o processo (stop → troca → start).
- Só é possível trocar o tipo com a instância parada; o script cuida disso, mas não pergunta confirmação antes de parar.
