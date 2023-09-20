/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 20/09/23
 */
import {ListBucketsCommand, S3Client} from '@aws-sdk/client-s3'

const s3Client = new S3Client({
    region: 'us-east-1',
});
const listBuckets = () => {
    s3Client.send(new ListBucketsCommand({}))
        .then((data) => {
            console.log(data)
        })
}

listBuckets()