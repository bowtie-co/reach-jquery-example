# reach-jquery-example
Helios Reach - Example content submission with jQuery


### User registration & authentication

1. Register user (find or create by email)
    - `POST /users`
    ```json
    {
        "name": "User Name",
        "email": "user@example.com"
    }
    ```
    - Response (implicit auth, including "code" value)
    ```json
    {
        "uid": "abc123",
        "code": "123xyz",
        "nonce": "blablabla123456"
    }
    ```
    - Response (explicit auth, require's user to provide "code" value)
    ```json
    {
        "uid": "abc123",
        "nonce": "blablabla123456"
    }
    ```
2. Login user
    - `POST /users/login`
    ```json
    {
        "uid": "abc123",
        "code": "123xyz",
        "nonce": "blablabla123456"
    }
    ```
    - Response
    ```json
    { "token": "abc.jsonwebtoken-data" }
    ```


### Post creation & content upload

1. Submit new post request (provide filename/info and request upload)
    - `POST /posts` (with bearer auth token header)
    ```json
    {
        "filename": "example.png",
        "filetype": "image/png",
        "filesize": 12345
    }
    ```
    - Response
    ```json
    {
        "_id": "postId123",
        "signedPutUrl": "https://s3.direct-upload-url",
        "signedGetUrl": "https://s3.signed-get-url"
    }
    ```
2. Upload raw file data/blob using signed put url
    - `PUT <signedPutUrl>`
    - Response (expect `2xx OK`)
3. Submit user post for moderation (or auto-approval if moderation disabled)
    - Allows for optional "preview" step before officially submitting for moderation review
    - Chain request's with post create & upload to skip optional preview/submit step
    - `POST /posts/<POST._id>/submit`
    - Response (expect `2xx OK`)
