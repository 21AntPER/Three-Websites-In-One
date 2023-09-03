// to make the file look neater

var viewsCalc = ( item ) => {
    var x, z;
    switch(true) {
        case item >= 1000 && item < 10000 :
             x = (item / 1000).toString().slice(0, 3)
             z = `${x}K views`
             break;
         case item >= 10000 && item < 100000 :
            x = (item / 1000).toString().substr(0, 2)
            z =`${x}K views`
            break;
         case item >= 100000 && item < 1000000 :
             x = (item / 1000).toString().substr(0, 3)
             z =`${x}K views`
             break;
         case item >= 1000000 && item < 10000000 :
             x = (item / 1000000).toString().substr(0, 3)
             z =`${x}M views`
             break;
         case item >= 10000000 && item < 100000000 :
            x = (item / 1000000).toString().substr(0, 2)
            z =`${x}M views`
            break;
         case item >= 100000000 && item < 1000000000 :
             x = (item / 1000000).toString().substr(0, 3)
             z =`${x}M views`
             break;
        case item === 1:
            z =`${item} view`
            break;
        default :
            z =`${item} views`
            break;
    }
    return z;   
}

const dbURI = '' //HIDDEN FOR SECURITY REASONS

module.exports = {viewsCalc: viewsCalc, dbURI};