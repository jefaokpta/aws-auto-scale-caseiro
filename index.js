/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 20/09/23
 */
import {DescribeInstancesCommand, EC2Client} from "@aws-sdk/client-ec2";

const ec2Client = new EC2Client({
    region: 'sa-east-1',
})
const checkInstanceStatus = (instanceId) => {
    ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
    })).then((data) => {
            console.log(data.Reservations[0].Instances[0])
    })
}

checkInstanceStatus('i-0f3cc179f13b3d217')