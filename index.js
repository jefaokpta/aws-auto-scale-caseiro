/**
 * @author Jefferson Alves Reis (jefaokpta) < jefaokpta@hotmail.com >
 * Date: 20/09/23
 */
import {S3Client} from '@aws-sdk/client-s3'

const s3Client = new S3Client({
    region: 'us-east-1',
});
const listBuckets = async (s3) => {
    const data = await s3Client.
    console.log(data)
}

listBuckets()