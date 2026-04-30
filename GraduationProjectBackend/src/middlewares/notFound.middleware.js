//اي روتس مش موجودة نرجع ايرور 404

export function notFound(req,res){
    return res.status(404).json({ ok: false,
    code: "NOT_FOUND",
    message: `Route not found: ${req.method} ${req.originalUrl}`,})

}
//what does this file do? It defines a middleware function notFound that returns a 404 error response if the requested route is not found.