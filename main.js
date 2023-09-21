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

const ec2Client = new EC2Client({
    // region: 'sa-east-1',
    region: 'us-east-1',
})

const instanceTypeEnum = {
    't4g.nano': 't4g.nano',
    't4g.micro': 't4g.micro',
}

const instanceId = 'i-08c9ff890916fc02c'
const instanceType = instanceTypeEnum[process.argv[2]]
if (!instanceType) {
    console.log('⚠️ Tipo de instancia inválida')
    process.exit(1)
}
console.log('Tipo de instancia selecionada: ' + instanceType)

function changeInstanceType(instanceId, instanceType) {
    ec2Client.send(new ModifyInstanceAttributeCommand({
        InstanceId: instanceId,
        InstanceType: {
            Value: instanceType
        }
    })).then(async () => {
        console.log('Tipo de instancia alterado para ' + instanceType)
        setTimeout(startInstance, 30000, instanceId)
    })
}

function startInstance(instanceId){
    console.log('Iniciando instancia...')
    ec2Client.send(new StartInstancesCommand({
        InstanceIds: [instanceId]
    })).then((data) => {
        console.log(data.StartingInstances[0].CurrentState)
        checkPool(isInstanceRunning)
    })
}

function stopInstance(instanceId){
    console.log('Parando instancia...')
    ec2Client.send(new StopInstancesCommand({
        InstanceIds: [instanceId]
    })).then(async (data) => {
        console.log(data.StoppingInstances[0].CurrentState)
        checkPool(isInstanceStopped)
    })
}

function checkPool(checkFunction) {
    let tries = 0
    setTimeout(async () => {
        if (await checkFunction(instanceId)) console.log('🎉 Processo completado com sucesso!')
        else {
            tries++
            if (tries < 10) checkPool(checkFunction)
            else console.log('🧨 Huston, we have a problem!')
        }
    }, 30000)
}

async function isInstanceRunning(instanceId) {
    console.log('Verificando se a instancia está rodando...')
    const instance = await checkInstanceStatus(instanceId)
    console.log(instance.state)
    return instance.state.Code === 16
}

async function isInstanceStopped(instanceId) {
    console.log('Verificando se a instancia está parada...')
    const instance = await checkInstanceStatus(instanceId)
    console.log(instance.state)
    return instance.state.Code === 80
}

async function checkInstanceStatus(instanceId) {
    const data = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
    }))
    // console.log(data.Reservations[0].Instances[0])
    return {
        state: data.Reservations[0].Instances[0].State,
        instanceType: data.Reservations[0].Instances[0].InstanceType
    }
}

