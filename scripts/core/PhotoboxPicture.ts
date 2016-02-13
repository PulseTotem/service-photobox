/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

/**
 * Represent a picture taken using Photobox.
 */
class PhotoboxPicture {

    private _tag : string;

    private _localOriginalPicture : string;
    private _localMediumPicture : string;
    private _localSmallPicture : string;

    private _urlOriginalPicture : string;
    private _urlMediumPicture : string;
    private _urlSmallPicture : string;

    constructor(tag : string, _originalPicture : string) {
        this._tag = tag;
        this.setOriginalPicture(_originalPicture);
    }

    getURLOriginalPicture() : string {
        return this._urlOriginalPicture;
    }

    getURLMediumPicture() : string {
        return this._urlMediumPicture;
    }

    getURLSmallPicture() : string {
        return this._urlSmallPicture;
    }

    getTag() : string {
        return this._tag;
    }

    setOriginalPicture(originalPicture : string) {
        this._localOriginalPicture = originalPicture;
        this._urlOriginalPicture = PhotoboxUtils.getURLFromPath(originalPicture, this._tag);
    }

    setMediumPicture(mediumPicture : string) {
        this._localMediumPicture = mediumPicture;
        this._urlMediumPicture = PhotoboxUtils.getURLFromPath(mediumPicture, this._tag);
    }

    setSmallPicture(smallPicture : string) {
        this._localSmallPicture = smallPicture;
        this._urlSmallPicture = PhotoboxUtils.getURLFromPath(smallPicture, this._tag);
    }

    delete() {
        try {
            fs.unlinkSync(this._localOriginalPicture);
            Logger.debug("Delete the original picture at the path: "+this._localOriginalPicture);
        } catch (e) {
            Logger.error("Error when trying to delete the original picture at the path: "+this._localOriginalPicture+". "+e);
        }

        try {
            fs.unlinkSync(this._localMediumPicture);
            Logger.debug("Delete the medium picture at the path: "+this._localMediumPicture);
        } catch (e) {
            Logger.error("Error when trying to delete the medium picture at the path: "+this._localMediumPicture+". "+e);
        }

        try {
            fs.unlinkSync(this._localSmallPicture);
            Logger.debug("Delete the small picture at the path: "+this._localSmallPicture);
        } catch (e) {
            Logger.error("Error when trying to delete the small picture at the path: "+this._localSmallPicture+". "+e);
        }
    }
}