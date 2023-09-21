/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 20/09/23
 */
import {DescribeInstancesCommand, EC2Client, StartInstancesCommand, StopInstancesCommand} from "@aws-sdk/client-ec2";

const ec2Client = new EC2Client({
    // region: 'sa-east-1',
    region: 'us-east-1',
})

const instanceId = 'i-08c9ff890916fc02c'
const strongInstance = 't4g.micro'
const weakInstance = 't4g.nano'

stopInstance(instanceId)

function startInstance(instanceId){
    ec2Client.send(new StartInstancesCommand({
        InstanceIds: [instanceId]
    })).then((data) => {
        console.log(data)
    })
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

function stopInstance(instanceId){
    ec2Client.send(new StopInstancesCommand({
        InstanceIds: [instanceId]
    })).then(async (data) => {
        console.log(data.StoppingInstances[0].CurrentState)
        checkPool(isInstanceStopped)
    })
}

function checkPool(checkFunction) {
    setTimeout(async () => {
        if (await checkFunction(instanceId)) console.log('Processo completado com sucesso!')
        else checkPool(checkFunction)
    }, 60000)
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

