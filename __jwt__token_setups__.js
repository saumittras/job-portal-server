/**
 * 
 * 
 * 2. Send token (generated in the server side) to the client side local 
 * storage --easier
 * 
 * httpOnly cookies --> better
 * 
 * 
 * 3. for sensetive or secure or private or protected apis: send token to the
 *  *******************server side****************
 * app.use(cors({
 * origin: ['http://localhost:5173'],
 * credentials:true
 *}));
 * 
 * 4. validate the token in the server side🧮 
 * if valid: provide data if not valid : logout
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */