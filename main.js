/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 20/09/23
 */
import {
    DescribeInstancesCommand,
    EC2Client,
    ModifyInstanceAttributeCommand,
    StartInstancesCommand,
    StopInstancesCommand
} from "@aws-sdk/client-ec2";
import fs from "fs";

const instanceTypeEnum = {
    'c5n.xlarge': 'c5n.xlarge',
    'c5n.2xlarge': 'c5n.2xlarge',
    'c5n.4xlarge': 'c5n.4xlarge',
    't3a.small': 't3a.small',
}

const ec2Client = new EC2Client({
    region: 'sa-east-1',
})

const instanceId = process.argv[2]
const instanceType = instanceTypeEnum[process.argv[3]]
if (!instanceType) {
    logExternalFile('⚠️ Tipo de instancia inválida')
    process.exit(1)
}
let checkTries = 0
logExternalFile('🚀 Tipo de instancia selecionada: ' + instanceType)

stopInstance(instanceId)

function logExternalFile(message) {
    // log with timestamp
    fs.appendFileSync(
        '/var/log/auto-scale.log',
        new Date().toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'}) + ' - ' + message + '\n'
    )
    console.log(message)
}

function changeInstanceType(instanceId, instanceType) {
    ec2Client.send(new ModifyInstanceAttributeCommand({
        InstanceId: instanceId,
        InstanceType: {
            Value: instanceType
        }
    })).then(async () => {
        logExternalFile('🔄 Tipo de instancia alterado para ' + instanceType)
        setTimeout(startInstance, 30000, instanceId)
    })
}

function stopInstance(instanceId){
    logExternalFile('🛑 Parando instancia...')
    checkTries = 0
    ec2Client.send(new StopInstancesCommand({
        InstanceIds: [instanceId]
    })).then(async (data) => {
        logExternalFile(JSON.stringify(data.StoppingInstances[0].CurrentState))
        checkPool(isInstanceStopped, true)
    })
}

function startInstance(instanceId){
    logExternalFile('🚀 Iniciando instancia...')
    checkTries = 0
    ec2Client.send(new StartInstancesCommand({
        InstanceIds: [instanceId]
    })).then((data) => {
        logExternalFile(JSON.stringify(data.StartingInstances[0].CurrentState))
        checkPool(isInstanceRunning)
    })
}

function checkPool(checkFunction, change) {
    setTimeout(async () => {
        if (await checkFunction(instanceId)){
            if(change) changeInstanceType(instanceId, instanceType)
            else{
                logExternalFile('🎉 Processo completado com sucesso!')
                checkInstanceStatus(instanceId)
                    .then((data) => logExternalFile(JSON.stringify(data)))
            }
        }
        else {
            checkTries++
            if (checkTries < 10) checkPool(checkFunction, change)
            else {
                logExternalFile('🧨 Huston, we have a problem!')
                logExternalFile(JSON.stringify({instanceId, instanceType}))
                process.exit(1)
            }
        }
    }, 30000)
}

async function isInstanceRunning(instanceId) {
    logExternalFile('🔎 Verificando se a instancia está rodando...')
    const instance = await checkInstanceStatus(instanceId)
    logExternalFile(JSON.stringify(instance.state))
    return instance.state.Code === 16
}

async function isInstanceStopped(instanceId) {
    logExternalFile('🔎 Verificando se a instancia está parada...')
    const instance = await checkInstanceStatus(instanceId)
    logExternalFile(JSON.stringify(instance.state))
    return instance.state.Code === 80
}

async function checkInstanceStatus(instanceId) {
    const data = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
    }))
    return {
        state: data.Reservations[0].Instances[0].State,
        instanceType: data.Reservations[0].Instances[0].InstanceType,
        name: data.Reservations[0].Instances[0].Tags[0].Value
    }
}

