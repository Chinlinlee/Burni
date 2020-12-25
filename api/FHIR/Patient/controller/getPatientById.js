const mongodb = require('models/mongodb');
const {
    handleError
} = require('../../../../models/FHIR/httpMessage');
module.exports = async function(req, res) {
    let id = req.params.id;
    try {
        let docs = await mongodb.Patient.findOne({
            id: id
        }).exec();
        if (docs) {
            return res.status(200).json(docs.getFHIRField());
        }
        let errorMessage = `not found Patient/${id}`;
        return res.status(404).json(handleError["not-found"](errorMessage));
    } catch (e) {
        console.log('api api/fhir/Patient/:id has error, ', e)
        return res.status(500).json(handleError.exception('server has something error'));
    }
};