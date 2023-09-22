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
import axios from "axios";

const instanceTypeEnum = {
    't4g.nano': 't4g.nano',
    't4g.micro': 't4g.micro',
}

const ec2Client = new EC2Client({
    // region: 'sa-east-1',
    region: 'us-east-1',
})

const instanceId = process.argv[2]
const instanceType = instanceTypeEnum[process.argv[3]]
if (!instanceType) {
    console.log('⚠️ Tipo de instancia inválida')
    process.exit(1)
}
let checkTries = 0
console.log('🚀 Tipo de instancia selecionada: ' + instanceType)

stopInstance(instanceId)

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

function stopInstance(instanceId){
    console.log('Parando instancia...')
    checkTries = 0
    ec2Client.send(new StopInstancesCommand({
        InstanceIds: [instanceId]
    })).then(async (data) => {
        console.log(data.StoppingInstances[0].CurrentState)
        checkPool(isInstanceStopped, true)
    })
}

function startInstance(instanceId){
    console.log('Iniciando instancia...')
    checkTries = 0
    ec2Client.send(new StartInstancesCommand({
        InstanceIds: [instanceId]
    })).then((data) => {
        console.log(data.StartingInstances[0].CurrentState)
        checkPool(isInstanceRunning)
    })
}

function checkPool(checkFunction, change) {
    setTimeout(async () => {
        if (await checkFunction(instanceId)){
            if(change) changeInstanceType(instanceId, instanceType)
            else{
                console.log('🎉 Processo completado com sucesso!')
                checkInstanceStatus(instanceId)
                    .then((data) => axios.post('https://coral-app-ld8ei.ondigitalocean.app/wip/public/auto-scale', data))
            }
        }
        else {
            checkTries++
            if (checkTries < 10) checkPool(checkFunction, change)
            else {
                console.log('🧨 Huston, we have a problem!')
                axios.post('https://coral-app-ld8ei.ondigitalocean.app/wip/public/auto-scale', {
                    instenceId: instanceId,
                    instanceType: instanceType,
                    message: '🧨 Huston, we have a problem!'
                })
                process.exit(1)
            }
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
    return {
        state: data.Reservations[0].Instances[0].State,
        instanceType: data.Reservations[0].Instances[0].InstanceType,
        name: data.Reservations[0].Instances[0].Tags[0].Value
    }
}

