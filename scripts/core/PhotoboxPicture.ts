/**
 * @author Simon Urli <simon@the6thscreen.fr>
 */

var moment = require('moment');
/**
 * Represent a picture taken using Photobox.
 */
class PhotoboxPicture {

    private _hashid : string;

    private _urlOriginalPicture : string;
    private _urlMediumPicture : string;
    private _picture : Picture;

    constructor(hashid : string) {
        this._hashid = hashid;

        this._urlOriginalPicture = ServiceConfig.getCMSHost() + "images/" + this._hashid + "/raw?size=original";
        this._urlMediumPicture = ServiceConfig.getCMSHost() + "images/" + this._hashid + "/raw?size=medium";

        this.initPicture();
    }
    
    private initPicture() {
        var picture : Picture = new Picture();
        picture.setId(this._hashid);
        var pictureCreationDate : any = moment.moment();
        picture.setCreationDate(pictureCreationDate.toDate());
        
        var pictureOriginalURL : PictureURL = new PictureURL();
        pictureOriginalURL.setId(this._hashid + "_original");
        pictureOriginalURL.setURL(this._urlOriginalPicture);
        picture.setOriginal(pictureOriginalURL);

        var pictureLargeURL : PictureURL = new PictureURL();
        pictureLargeURL.setId(this._hashid + "_large");
        pictureLargeURL.setURL(ServiceConfig.getCMSHost() + "images/" + this._hashid + "/raw?size=large");
        picture.setLarge(pictureLargeURL);

        var pictureMediumURL : PictureURL = new PictureURL();
        pictureMediumURL.setId(this._hashid + "_medium");
        pictureMediumURL.setURL(this._urlMediumPicture);
        picture.setMedium(pictureMediumURL);

        var pictureSmallURL : PictureURL = new PictureURL();
        pictureSmallURL.setId(this._hashid + "_small");
        pictureSmallURL.setURL(ServiceConfig.getCMSHost() + "images/" + this._hashid + "/raw?size=small");
        picture.setSmall(pictureSmallURL);

        var pictureThumbURL : PictureURL = new PictureURL();
        pictureThumbURL.setId(this._hashid + "_thumb");
        pictureThumbURL.setURL(ServiceConfig.getCMSHost() + "images/" + this._hashid + "/raw?size=thumb");
        picture.setThumb(pictureThumbURL);

        this._picture = picture;
    }

    getURLOriginalPicture() : string {
        return this._urlOriginalPicture;
    }

    getURLMediumPicture() : string {
        return this._urlMediumPicture;
    }

    getPicture() : Picture {
        return this._picture;
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